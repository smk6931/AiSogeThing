"""force add vector extension and columns

Revision ID: 999999999999
Revises: 0c7db2cc67d8
Create Date: 2024-01-25 17:05:00.000000

"""
from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector

# revision identifiers, used by Alembic.
revision = '999999999999'
down_revision = '0c7db2cc67d8' # 가장 최근 파일 ID로 연결
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. Enable pgvector extension
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    # 2. Add embedding columns (youtube_list)
    # Check if column exists to avoid error
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='youtube_list' AND column_name='embedding') THEN
                ALTER TABLE youtube_list ADD COLUMN embedding vector(1536);
            END IF;
        END
        $$;
    """)

    # 3. Add embedding columns (youtube_channels)
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='youtube_channels' AND column_name='embedding') THEN
                ALTER TABLE youtube_channels ADD COLUMN embedding vector(1536);
            END IF;
        END
        $$;
    """)

def downgrade() -> None:
    op.execute("ALTER TABLE youtube_list DROP COLUMN IF EXISTS embedding")
    op.execute("ALTER TABLE youtube_channels DROP COLUMN IF EXISTS embedding")
    # op.execute("DROP EXTENSION IF EXISTS vector") # 익스텐션은 함부로 끄지 않음
