from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas import Table, CreateTableDTO, UpdateTableStatusDTO, ErrorResponse
from app.services import table_service

router = APIRouter(prefix="/api/v1/tables", tags=["Tables"])

@router.get("", response_model=List[Table])
async def list_tables(db: AsyncSession = Depends(get_db)):
    return await table_service.list_tables(db)

@router.post("", response_model=Table, status_code=status.HTTP_201_CREATED, responses={400: {"model": ErrorResponse}})
async def create_table(
    dto: CreateTableDTO,
    db: AsyncSession = Depends(get_db),
):
    return await table_service.create_table(db, dto)

@router.patch("/{table_id}/status", response_model=Table, responses={404: {"model": ErrorResponse}})
async def update_table_status(
    table_id: str,
    dto: UpdateTableStatusDTO,
    db: AsyncSession = Depends(get_db),
):
    return await table_service.update_table_status(db, table_id, dto.status, dto.free_party)
