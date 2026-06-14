import cv2
import json
import numpy as np
import tempfile

from insightface.app import FaceAnalysis


class FaceService:

    def __init__(self):
        self.app = FaceAnalysis(
            name="buffalo_l",
            providers=["CPUExecutionProvider"],
        )

        self.app.prepare(
            ctx_id=0,
            det_size=(640, 640),
        )

    def extract_embedding(self, image_path: str):

        image = cv2.imread(image_path)

        if image is None:
            raise ValueError("Invalid image")

        faces = self.app.get(image)

        if len(faces) == 0:
            raise ValueError("No face detected")

        return faces[0].embedding.tolist()

    def extract_embedding_from_bytes(
        self,
        image_bytes: bytes,
    ):

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=".jpg",
        ) as temp_file:

            temp_file.write(image_bytes)
            temp_path = temp_file.name

        return self.extract_embedding(temp_path)

    def compare_embeddings(
        self,
        embedding1,
        embedding2,
    ):

        a = np.array(embedding1)
        b = np.array(embedding2)

        similarity = np.dot(a, b) / (
            np.linalg.norm(a)
            * np.linalg.norm(b)
        )

        return float(similarity)

    def compare_with_stored_embedding(
        self,
        stored_embedding: str,
        image_bytes: bytes,
    ):

        current_embedding = self.extract_embedding_from_bytes(
            image_bytes
        )

        stored_embedding = json.loads(
            stored_embedding
        )

        similarity = self.compare_embeddings(
            stored_embedding,
            current_embedding,
        )

        return similarity