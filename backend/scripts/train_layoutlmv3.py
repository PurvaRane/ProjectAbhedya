import os
import sys
import logging
import multiprocessing
import logging
from datasets import load_from_disk, concatenate_datasets
from transformers import (
    LayoutLMv3Processor,
    LayoutLMv3ForSequenceClassification,
    TrainingArguments,
    Trainer,
    DefaultDataCollator
)
import torch
import numpy as np
from sklearn.metrics import accuracy_score, precision_recall_fscore_support

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# ==========================================
# CONFIGURATION
# ==========================================
# WARNING: Training 15,000+ images requires massive compute power.
# If False, we will only train a 500-image subset for 1 Epoch to prove the pipeline works.
TRAIN_FULL_DATASET = True

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_PART1_PATH = os.path.join(BASE_DIR, "datasets", "layoutlm_dataset")
DATASET_PART2_PATH = os.path.join(BASE_DIR, "datasets", "layoutlm_dataset_part2")
OUTPUT_MODEL_DIR = os.path.join(BASE_DIR, "models", "layoutlmv3_finetuned")

logger.info("Loading microsoft/layoutlmv3-base Processor...")
processor = LayoutLMv3Processor.from_pretrained("microsoft/layoutlmv3-base", apply_ocr=False)

def prepare_dataset(batch):
    """Transform function to convert raw HF dataset into LayoutLMv3 tensors on the fly."""
    images = batch["image"]
    words = batch["words"]
    boxes = batch["bboxes"]
    
    # Encoding truncates text to 512 tokens to fit into transformer memory
    encoding = processor(
        images,
        words,
        boxes=boxes,
        truncation=True,
        padding="max_length",
        max_length=512,
        return_tensors="pt"
    )
    
    encoding["labels"] = torch.tensor(batch["label"])
    return encoding

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
    logger.info("Initializing LayoutLMv3 Training Pipeline...")
    
    # 1. Load Datasets
    logger.info("Loading Datasets from disk...")
    ds_part1 = None
    ds_part2 = None
    datasets_to_merge = []
    
    if os.path.exists(DATASET_PART1_PATH):
        ds_part1 = load_from_disk(DATASET_PART1_PATH)
        logger.info(f"Loaded Part 1: {len(ds_part1)} documents.")
        datasets_to_merge.append(ds_part1)
        
    if os.path.exists(DATASET_PART2_PATH):
        ds_part2 = load_from_disk(DATASET_PART2_PATH)
        logger.info(f"Loaded Part 2: {len(ds_part2)} documents.")
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
    
    # 4. Processor applied
    logger.info("Tokenizing and processing Training Dataset (This may take a while)...")
    train_ds.set_transform(prepare_dataset)
    eval_ds.set_transform(prepare_dataset)
    
    # 5. Initialize Model
    logger.info("Loading LayoutLMv3ForSequenceClassification Base Model...")
    model = LayoutLMv3ForSequenceClassification.from_pretrained(
        "microsoft/layoutlmv3-base",
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
        per_device_train_batch_size=4, # Increased from 2 for faster training
        per_device_eval_batch_size=4,
        gradient_accumulation_steps=2, # Effective batch size = 4 * 2 = 8 for stable gradients
        dataloader_num_workers=max(1, multiprocessing.cpu_count() - 1),
        dataloader_pin_memory=False, # MPS does not support pinned memory
        num_train_epochs=1 if not TRAIN_FULL_DATASET else 5, # Increased to 5 epochs
        weight_decay=0.05, # Increased to heavily punish overfitting
        warmup_ratio=0.1, # Smooth learning rate ramp up
        load_best_model_at_end=True,
        metric_for_best_model="f1",
        logging_steps=10,
        remove_unused_columns=False, # Crucial: LayoutLM requires image columns that HF Trainer might auto-drop
        push_to_hub=False,
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
    logger.info("Starting LayoutLMv3 Fine-Tuning Process!!!")
    trainer.train(resume_from_checkpoint=True)
    
    # 9. Save final artifacts
    logger.info(f"Training Complete! Saving final model to {OUTPUT_MODEL_DIR}...")
    trainer.save_model(OUTPUT_MODEL_DIR)
    processor.save_pretrained(OUTPUT_MODEL_DIR)
    logger.info("Saved! The model is now ready for production inference.")

if __name__ == "__main__":
    main()
