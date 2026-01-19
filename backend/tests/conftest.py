import pytest
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from apps import create_app, db
from apps.base.models import Company, Product


class TestConfig:
    """Test configuration."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = 'test-secret-key'
    WTF_CSRF_ENABLED = False


@pytest.fixture
def app():
    """Create application for testing."""
    application = create_app(TestConfig)

    with application.app_context():
        db.create_all()
        yield application
        db.drop_all()


@pytest.fixture
def client(app):
    """Create a test client."""
    return app.test_client()


@pytest.fixture
def sample_company(app):
    """Create a sample company for testing."""
    with app.app_context():
        company = Company(name='Test Company')
        db.session.add(company)
        db.session.commit()
        company_id = company.id
    return company_id


@pytest.fixture
def sample_product(app, sample_company):
    """Create a sample product for testing."""
    with app.app_context():
        product = Product(
            name='Test Product',
            comment='Test Comment',
            quantity=10,
            company_id=sample_company
        )
        db.session.add(product)
        db.session.commit()
        product_id = product.id
    return product_id
