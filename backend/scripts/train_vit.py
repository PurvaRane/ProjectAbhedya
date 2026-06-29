import os
import sys
import logging
import multiprocessing
import logging
from datasets import load_from_disk, concatenate_datasets
from transformers import (
    ViTImageProcessor,
    ViTForImageClassification,
    TrainingArguments,
    Trainer,
    DefaultDataCollator
)
import torch
import torchvision.transforms as transforms
from sklearn.metrics import accuracy_score, precision_recall_fscore_support

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# ==========================================
# CONFIGURATION
# ==========================================
# WARNING: Training on 23,000+ images requires massive compute power.
# If False, we will only train a 500-image subset for 1 Epoch to prove the pipeline works.
TRAIN_FULL_DATASET = True

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_PART1_PATH = os.path.join(BASE_DIR, "datasets", "layoutlm_dataset")
DATASET_PART2_PATH = os.path.join(BASE_DIR, "datasets", "layoutlm_dataset_part2")
OUTPUT_MODEL_DIR = os.path.join(BASE_DIR, "models", "vit_finetuned")
MODEL_CHECKPOINT = "google/vit-base-patch16-224-in21k"

logger.info(f"Loading {MODEL_CHECKPOINT} Image Processor...")
processor = ViTImageProcessor.from_pretrained(MODEL_CHECKPOINT)

def transform_images(batch):
    """Transform function to convert PIL images into ViT pixel value tensors."""
    # Data Augmentation to prevent memorization and increase accuracy
    augmentation = transforms.Compose([
        transforms.RandomRotation(degrees=10),
        transforms.ColorJitter(brightness=0.1, contrast=0.1),
    ])
    
    # Ensure all images are RGB to avoid 1-channel grayscale crash
    images = [augmentation(img.convert("RGB")) for img in batch["image"]]
    
    # Processor handles resizing to 224x224 and normalization
    inputs = processor(images, return_tensors="pt")
    
    # We also pass through the labels
    inputs["labels"] = torch.tensor(batch["label"])
    return inputs

def compute_metrics(pred):
    """Calculates accuracy and F1 score during evaluation."""
    labels = pred.label_ids
    preds = pred.predictions.argmax(-1)
    precision, recall, f1, _ = precision_recall_fscore_support(labels, preds, average="binary")
    acc = accuracy_score(labels, preds)
    return {
        "accuracy": acc,
        "f1": f1,
        "precision": precision,
        "recall": recall
    }

def main():
    logger.info("Initializing Vision Transformer (ViT) Pixel-Level Training Pipeline...")
    
    # 1. Load Datasets
    logger.info("Loading Datasets from disk...")
    datasets_to_merge = []
    
    if os.path.exists(DATASET_PART1_PATH):
        ds_part1 = load_from_disk(DATASET_PART1_PATH)
        datasets_to_merge.append(ds_part1)
        
    if os.path.exists(DATASET_PART2_PATH):
        ds_part2 = load_from_disk(DATASET_PART2_PATH)
        datasets_to_merge.append(ds_part2)
        
    if not datasets_to_merge:
        logger.error("No extracted datasets found! Please run the extraction scripts first.")
        sys.exit(1)
        
    # 2. Concatenate Datasets
    full_dataset = concatenate_datasets(datasets_to_merge)
    logger.info(f"Successfully merged datasets. Total size: {len(full_dataset)} documents.")
    
    # Optional Subset for fast demo verification
    if not TRAIN_FULL_DATASET:
        logger.warning("TRAIN_FULL_DATASET is False. Creating a 500-document subset for fast demonstration.")
        full_dataset = full_dataset.shuffle(seed=42).select(range(min(500, len(full_dataset))))
    
    # 3. Train / Test Split (90/10)
    logger.info("Splitting into Train (90%) and Eval (10%)...")
    ds_split = full_dataset.train_test_split(test_size=0.1, seed=42)
    train_ds = ds_split["train"]
    eval_ds = ds_split["test"]
    
    # 4. Apply ViT Processor
    logger.info("Applying ViT Image Processor to dataset...")
    # Using set_transform ensures the images are processed on-the-fly to save memory
    train_ds.set_transform(transform_images)
    eval_ds.set_transform(transform_images)
    
    # 5. Initialize Model
    logger.info("Loading ViTForImageClassification Base Model...")
    model = ViTForImageClassification.from_pretrained(
        MODEL_CHECKPOINT,
        num_labels=2, # 0 = Genuine, 1 = Forged
        id2label={0: "GENUINE", 1: "FORGED"},
        label2id={"GENUINE": 0, "FORGED": 1}
    )
    
    # 6. Configure Training Arguments
    training_args = TrainingArguments(
        output_dir=OUTPUT_MODEL_DIR,
        eval_strategy="epoch",
        save_strategy="epoch",
        learning_rate=1e-5, # Lowered for finer convergence
        per_device_train_batch_size=8, # ViT is slightly lighter than LayoutLMv3
        per_device_eval_batch_size=8,
        dataloader_num_workers=max(1, multiprocessing.cpu_count() - 1),
        num_train_epochs=1 if not TRAIN_FULL_DATASET else 5, # Increased to 5 epochs
        weight_decay=0.05, # Increased to heavily punish overfitting
        warmup_ratio=0.1, # Smooth learning rate ramp up
        load_best_model_at_end=True,
        metric_for_best_model="f1",
        logging_steps=10,
        remove_unused_columns=False, # Crucial: prevents HuggingFace from dropping the 'image' column
        push_to_hub=False,
        dataloader_pin_memory=False, # Crucial for Mac MPS
    )
    
    # 7. Initialize Trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_ds,
        eval_dataset=eval_ds,
        compute_metrics=compute_metrics,
        tokenizer=processor,
        data_collator=DefaultDataCollator()
    )
    
    # 8. Train
    logger.info("Starting Vision Transformer Fine-Tuning Process!!!")
    has_checkpoints = False
    if os.path.exists(OUTPUT_MODEL_DIR):
        if any(d.startswith("checkpoint") for d in os.listdir(OUTPUT_MODEL_DIR)):
            has_checkpoints = True
            
    trainer.train(resume_from_checkpoint=has_checkpoints)
    
    # 9. Save final artifacts
    logger.info(f"Training Complete! Saving final pixel-level forgery model to {OUTPUT_MODEL_DIR}...")
    trainer.save_model(OUTPUT_MODEL_DIR)
    processor.save_pretrained(OUTPUT_MODEL_DIR)
    logger.info("Saved! The ViT model is now a highly specialized forgery microscope.")

if __name__ == "__main__":
    main()
