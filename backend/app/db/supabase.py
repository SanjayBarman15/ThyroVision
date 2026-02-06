# from supabase import create_client
# import os
# from dotenv import load_dotenv

# load_dotenv()

# SUPABASE_URL = os.getenv("SUPABASE_URL")
# SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
#     raise RuntimeError("Supabase environment variables not set")

# supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

from supabase import create_client
import os
from dotenv import load_dotenv

# 🔑 Load env vars BEFORE reading them
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not ANON_KEY or not SERVICE_KEY:
    raise RuntimeError("Supabase env vars not set")

# 🔐 Used ONLY for auth verification
supabase_auth = create_client(SUPABASE_URL, ANON_KEY)

# 🔑 Used for DB + storage + ML
supabase_admin = create_client(SUPABASE_URL, SERVICE_KEY)

# 📦 Storage Constants
STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "ThyroSight-images")

