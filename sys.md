    Thyroid Ultrasound AI System – Detailed Architecture Explanation
    1. Overview

    The Thyroid Ultrasound AI System is an end-to-end clinical decision support platform designed to assist doctors in classifying thyroid nodules using ultrasound images. It integrates frontend, backend, ML inference, explainability, and database components in a secure and scalable architecture.

    The system includes:

    Frontend – Web application for doctors to authenticate, input patient data, and upload images.

    Backend API – FastAPI service that handles requests, orchestrates ML inference, and communicates with the database.

    ML Inference Engine – PyTorch-based ResNet model for TI-RADS classification with Grad-CAM explainability.

    Database and Storage – Supabase PostgreSQL and Storage buckets for patient data, images, and prediction results.

    Deployment Layer – Docker containerization for backend, Vercel for frontend, and Render for backend hosting.

    2. Actors & Users

    Doctor (Primary User): Interacts with the system via a web browser to:

    Log in and authenticate

    Enter patient information

    Upload thyroid ultrasound images

    Review predictions, confidence scores, and Grad-CAM visualizations

    Submit feedback to improve the ML model

    3. Frontend Architecture
    3.1 Technology Stack

    Framework: Next.js (React)

    Hosting: Vercel

    Communication: REST APIs over HTTPS to the backend

    3.2 Responsibilities

    Doctor authentication (via Supabase Auth)

    Patient data entry (name, age, gender, notes)

    Image upload interface

    Display of:

    TI-RADS prediction

    Confidence score

    Grad-CAM heatmap overlay

    Feedback submission (correct/incorrect prediction)

    3.3 Interaction Flow

    Doctor logs in → Frontend validates session via Supabase Auth.

    Doctor selects or enters patient information.

    Doctor uploads ultrasound image → Frontend sends image to backend API.

    Backend responds with prediction, confidence, and Grad-CAM image.

    Frontend renders results and allows feedback submission.

    4. Backend Architecture
    4.1 Technology Stack

    Language: Python

    Framework: FastAPI

    Deployment: Docker container on Render

    Responsibilities:

    Handle REST API requests from frontend

    Validate and preprocess uploaded images

    Call ML inference engine

    Generate Grad-CAM explainability heatmaps

    Store results and feedback in Supabase database/storage

    4.2 Folder Structure (Backend)
    backend/
    ├── app/
    │   ├── api/                 # FastAPI route definitions (image upload, prediction, feedback)
    │   ├── services/            # ML logic
    │   │   ├── preprocessing.py
    │   │   ├── inference.py
    │   │   └── explainability.py
    │   ├── models/              # Model configuration / versioning
    │   └── db/                  # Supabase integration
    ├── models/
    │   └── thyroid_resnet_v1/
    │       ├── model.pt
    │       ├── config.json
    │       └── metrics.json
    ├── main.py
    ├── Dockerfile
    ├── requirements.txt
    └── .env

    5. ML Inference Engine
    5.1 Model Design

    Backbone: ResNet pretrained on ImageNet

    Head: Lightweight classification head

    Output Classes: 6 TI-RADS categories (2 → 5)

    Format: PyTorch .pt file (state_dict)

    5.2 Inference Pipeline

    Backend receives uploaded ultrasound image

    Image preprocessing:

    Resize to 224×224

    Normalize using ImageNet mean and std

    Convert to PyTorch tensor and add batch dimension

    Model inference → Softmax probabilities

    Grad-CAM explainability:

    Register hooks on last convolutional layer

    Compute class-specific gradients

    Generate heatmap overlay

    Save prediction, confidence score, and Grad-CAM image to Supabase Storage

    Return prediction results to frontend

    6. Grad-CAM Explainability

    Highlights regions of the image influencing the ML model prediction

    Increases trust and interpretability for clinicians

    Output includes:

    Original image

    Grad-CAM heatmap

    Overlayed annotated image

    7. Database & Storage Architecture
    7.1 Supabase Components

    Authentication: Manages doctor accounts securely

    PostgreSQL: Stores structured data

    Patient information

    Image metadata

    Model predictions and confidence scores

    Feedback from doctors

    Storage Buckets: Stores large binary objects

    Original ultrasound images

    Grad-CAM annotated images

    7.2 Data Flow

    Backend receives image and patient metadata

    Prediction and Grad-CAM results are generated

    Backend uploads images and metadata to Supabase Storage and PostgreSQL

    Frontend queries Supabase for historical results or feedback updates

    8. Docker & Deployment Architecture
    8.1 Backend Containerization

    Backend API and ML engine are packaged as a Docker container.

    Ensures reproducible and isolated runtime environments.

    Includes all dependencies: Python, PyTorch, OpenCV, ML model weights.

    Single Uvicorn worker is used for inference to avoid thread-safety issues.

    8.2 Dockerfile Summary
    FROM python:3.10-slim
    ENV PYTHONUNBUFFERED=1
    WORKDIR /app
    RUN apt-get update && apt-get install -y libgl1 && rm -rf /var/lib/apt/lists/*
    COPY requirements.txt .
    RUN pip install --no-cache-dir -r requirements.txt
    COPY app ./app
    COPY main.py .
    COPY models ./models
    EXPOSE 8000
    CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]

    8.3 Deployment Flow

    Backend Docker container is deployed on Render as a web service.

    Frontend is deployed separately on Vercel.

    Frontend communicates with backend API over HTTPS.

    Backend interacts with Supabase for storage and authentication.

    CI/CD pipelines automatically build and deploy updated Docker images for backend updates.

    9. Continuous Learning Pipeline

    Doctor feedback is stored in the database.

    High-quality corrections are curated into a dataset.

    New model versions are trained, evaluated, and packaged into a Docker image.

    Updated Docker container is redeployed to Render.

    Versioning ensures traceability and reproducibility of predictions.

    10. Data Flow Summary

    Doctor logs in via frontend → Authenticated with Supabase.

    Uploads patient data and ultrasound image → Frontend sends to backend.

    Backend:

    Preprocesses image

    Performs model inference

    Generates Grad-CAM heatmap

    Backend saves results to Supabase Storage & PostgreSQL.

    Frontend renders TI-RADS prediction, confidence, and heatmap.

    Doctor submits feedback → Stored for continuous learning.

    11. Key Interactions Between Components
    Component	Interaction
    Frontend → Backend	REST API call for image upload and prediction
    Backend → ML Engine	Preprocessing, inference, Grad-CAM generation
    Backend → Supabase	Store images, predictions, feedback, and patient info
    Frontend → Supabase	Authentication and historical data retrieval
    Continuous Learning Pipeline	Feedback → Dataset → Model retraining → Redeployment