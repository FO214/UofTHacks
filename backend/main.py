from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import numpy as np
import cv2
import io
import base64
from pydantic import BaseModel
from typing import List, Optional, Dict
import uuid
import os

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# In-memory storage for comments and perspectives
perspectives_db: Dict[str, Dict] = {}


class Comment(BaseModel):
    id: str
    image_id: str
    text: str
    perspective: str


@app.post("/upload/")
async def upload_image(file: UploadFile = File(...)):
    try:
        # Read and validate image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))

        # Generate unique ID for the image
        image_id = str(uuid.uuid4())

        # Save original image
        image_path = os.path.join(UPLOAD_DIR, f"{image_id}.png")
        image.save(image_path)

        # Convert to OpenCV format for transformations
        cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        height, width = cv_image.shape[:2]

        # Store the image dimensions and transformation matrices
        perspectives_db[image_id] = {
            "comments": [],
            "dimensions": (width, height),
            "transforms": {
                "birds_eye": cv2.getPerspectiveTransform(
                    np.float32([[0, 0], [width, 0], [0, height], [width, height]]),
                    np.float32(
                        [
                            [width * 0.2, 0],
                            [width * 0.8, 0],
                            [0, height],
                            [width, height],
                        ]
                    ),
                ),
                "worms_eye": cv2.getPerspectiveTransform(
                    np.float32([[0, 0], [width, 0], [0, height], [width, height]]),
                    np.float32(
                        [
                            [0, height * 0.2],
                            [width, height * 0.2],
                            [width * 0.2, height],
                            [width * 0.8, height],
                        ]
                    ),
                ),
            },
        }

        return {"image_id": image_id, "message": "Image uploaded successfully"}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/image/{image_id}/{perspective}")
async def get_transformed_image(image_id: str, perspective: str):
    try:
        if image_id not in perspectives_db:
            raise HTTPException(status_code=404, detail="Image not found")

        image_path = os.path.join(UPLOAD_DIR, f"{image_id}.png")
        image = cv2.imread(image_path)

        if perspective == "original":
            transformed = image
        else:
            # Get the stored transformation matrix
            transform = perspectives_db[image_id]["transforms"].get(perspective)
            if transform is None:
                raise HTTPException(status_code=400, detail="Invalid perspective")

            width, height = perspectives_db[image_id]["dimensions"]
            transformed = cv2.warpPerspective(image, transform, (width, height))

        # Convert to base64
        _, buffer = cv2.imencode(".png", transformed)
        base64_image = base64.b64encode(buffer).decode("utf-8")

        return {"image": base64_image}

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/comment/{image_id}")
async def add_comment(image_id: str, comment: Comment):
    if image_id not in perspectives_db:
        raise HTTPException(status_code=404, detail="Image not found")

    perspectives_db[image_id]["comments"].append(comment)
    return {"message": "Comment added successfully"}


@app.get("/comments/{image_id}")
async def get_comments(image_id: str):
    if image_id not in perspectives_db:
        raise HTTPException(status_code=404, detail="Image not found")

    return perspectives_db[image_id]["comments"]


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
