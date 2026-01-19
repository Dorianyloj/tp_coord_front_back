import pytest
import json


class TestProductEndpoint:
    """Tests for the /api/product endpoint."""

    def test_get_all_products_empty(self, client):
        """Test GET /api/product/ returns empty list when no products exist."""
        response = client.get('/api/product/')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'data' in data
        assert data['data'] == []

    def test_get_all_products(self, client, sample_product):
        """Test GET /api/product/ returns list of products."""
        response = client.get('/api/product/')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'data' in data
        assert len(data['data']) == 1
        assert data['data'][0]['name'] == 'Test Product'

    def test_get_product_by_id(self, client, sample_product):
        """Test GET /api/product/<id> returns specific product."""
        response = client.get(f'/api/product/{sample_product}')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['id'] == sample_product
        assert data['name'] == 'Test Product'
        assert data['comment'] == 'Test Comment'
        assert data['quantity'] == 10

    def test_create_product(self, client, sample_company):
        """Test POST /api/product/ creates a new product."""
        product_data = {
            'name': 'New Product',
            'comment': 'New Comment',
            'quantity': 5,
            'company_id': sample_company
        }
        response = client.post(
            '/api/product/',
            data=json.dumps(product_data),
            content_type='application/json'
        )
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['name'] == 'New Product'
        assert data['comment'] == 'New Comment'
        assert data['quantity'] == 5

    def test_update_product(self, client, sample_product):
        """Test PUT /api/product/<id> updates a product."""
        update_data = {
            'name': 'Updated Product',
            'comment': 'Updated Comment',
            'quantity': 20
        }
        response = client.put(
            f'/api/product/{sample_product}',
            data=json.dumps(update_data),
            content_type='application/json'
        )
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['name'] == 'Updated Product'
        assert data['comment'] == 'Updated Comment'
        assert data['quantity'] == 20

    def test_delete_product(self, client, sample_product):
        """Test DELETE /api/product/<id> deletes a product."""
        response = client.delete(f'/api/product/{sample_product}')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['message'] == 'Product deleted successfully'

        # Verify product is deleted
        response = client.get('/api/product/')
        data = json.loads(response.data)
        assert len(data['data']) == 0

    def test_delete_nonexistent_product(self, client):
        """Test DELETE /api/product/<id> returns 404 for nonexistent product."""
        response = client.delete('/api/product/99999')
        assert response.status_code == 404
        data = json.loads(response.data)
        assert data['message'] == 'Product not found'

    def test_product_has_company_relation(self, client, sample_product):
        """Test that product response includes company information."""
        response = client.get(f'/api/product/{sample_product}')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'company' in data
        assert data['company']['name'] == 'Test Company'

    def test_filter_products_by_company_id(self, client, sample_product, sample_company):
        """Test GET /api/product/?company_id=<id> filters products."""
        response = client.get(f'/api/product/?company_id={sample_company}')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data['data']) == 1
        assert data['data'][0]['company_id'] == sample_company
