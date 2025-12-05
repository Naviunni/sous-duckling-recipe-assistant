# iui/backend/models.py

from sqlalchemy import Column, Integer, String, ForeignKey, TIMESTAMP, JSON, ARRAY, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base # Import our new Base class
import uuid

# Table 1: users
class User(Base):
    __tablename__ = "users"
    
    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    
    # Relationships (good to define now, even if not used yet)
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    recipes = relationship("SavedRecipe", back_populates="user", cascade="all, delete-orphan")
    grocery_list = relationship("GroceryList", back_populates="user", uselist=False, cascade="all, delete-orphan")

# Table 2: user_profiles
class UserProfile(Base):
    __tablename__ = "user_profiles"
    
    profile_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False, unique=True)
    allergies = Column(ARRAY(Text), default=[])
    dietary_restrictions = Column(ARRAY(Text), default=[])
    disliked_ingredients = Column(ARRAY(Text), default=[])
    skill_level = Column(String(50))
    
    user = relationship("User", back_populates="profile")

# Table 3: saved_recipes
class SavedRecipe(Base):
    __tablename__ = "saved_recipes"
    
    recipe_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False, index=True)
    recipe_title = Column(String(255), nullable=False)
    recipe_data = Column(JSONB, nullable=False)
    saved_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="recipes")


class GroceryList(Base):
    __tablename__ = "grocery_lists"

    list_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False, unique=True)
    list_data = Column(JSONB, nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="grocery_list")
