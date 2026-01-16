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
    features JSONB, -- Added for dynamic AI explanation features
    bounding_box JSONB, -- Added for dynamic ROI display

    processed_image_id UUID
        REFERENCES processed_images(id),

    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================
-- 5. Prediction Feedback Table
-- ============================
CREATE TABLE prediction_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    prediction_id UUID NOT NULL
        REFERENCES predictions(id) ON DELETE CASCADE,

    doctor_id UUID NOT NULL
        REFERENCES doctors(id) ON DELETE CASCADE,

    is_correct BOOLEAN NOT NULL,

    corrected_tirads INT CHECK (corrected_tirads BETWEEN 1 AND 5),
    corrected_features JSONB,

    comments TEXT,

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

    level TEXT NOT NULL
        CHECK (level IN ('INFO','WARN','ERROR','FATAL')),

    action TEXT NOT NULL,

    actor_id UUID,
    actor_role TEXT CHECK (actor_role IN ('doctor','radiologist','system')),

    resource_type TEXT,
    resource_id UUID,

    request_id UUID NOT NULL,

    metadata JSONB,

    error_code TEXT,
    error_message TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);
