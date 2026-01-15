DATABASE SCHEMA FOR MEDICAL IMAGE ANALYSIS 
-- ============================
-- 1. Doctors Table
-- ============================
CREATE TABLE public.doctors (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- ============================
-- 2. Patients Table
-- ============================
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    dob DATE,
    age INT,                  -- optional, can be auto-calculated via trigger
    gender TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    past_medical_data TEXT  -- optional
);

-- ============================
-- 3. Images Tables
-- ============================
CREATE TABLE raw_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    patient_id UUID NOT NULL
        REFERENCES patients(id) ON DELETE CASCADE,

    doctor_id UUID NOT NULL
        REFERENCES doctors(id) ON DELETE CASCADE,

    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,

    uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE processed_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    raw_image_id UUID NOT NULL
        REFERENCES raw_images(id) ON DELETE CASCADE,

    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,

    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================
-- 4. Predictions Table
-- ============================
CREATE TABLE predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    raw_image_id UUID NOT NULL
        REFERENCES raw_images(id) ON DELETE CASCADE,

    predicted_class INT NOT NULL,
    tirads INT NOT NULL CHECK (tirads BETWEEN 1 AND 5),
    confidence FLOAT NOT NULL CHECK (confidence BETWEEN 0 AND 1),

    model_version TEXT NOT NULL,
    training_candidate BOOLEAN DEFAULT FALSE,

    inference_time_ms INT CHECK (inference_time_ms >= 0),

    processed_image_id UUID
        REFERENCES processed_images(id),

    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================
-- 5. Prediction Feedback Table
-- ============================
CREATE TABLE prediction_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prediction_id UUID NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    feedback_text TEXT NOT NULL,
    corrected_class INT,
    corrected_tirads INT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================
-- 6. Training Labels Table
-- ============================
CREATE TABLE training_labels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    raw_image_id UUID NOT NULL
        REFERENCES raw_images(id) ON DELETE CASCADE,

    labeled_by TEXT NOT NULL, -- doctor | radiologist | ml_team
    tirads INT NOT NULL CHECK (tirads BETWEEN 1 AND 5),

    bounding_boxes JSONB,  -- optional (x, y, w, h)
    notes TEXT,

    approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================
-- 7. System Logs Table (NEW)
-- ============================
CREATE TABLE system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID REFERENCES doctors(id),
    action TEXT NOT NULL,              -- e.g. IMAGE_UPLOAD, MODEL_INFERENCE
    resource_type TEXT,                -- image, prediction, feedback
    resource_id UUID,                  -- id of image/prediction
    status TEXT NOT NULL,              -- SUCCESS / FAILURE
    message TEXT,                      -- optional details
    created_at TIMESTAMP DEFAULT NOW()
);