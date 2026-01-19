import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductList from '../components/ProductList';

// Mock graphql-ws
jest.mock('graphql-ws', () => ({
  createClient: jest.fn(() => ({
    subscribe: jest.fn(),
  })),
}));

const mockProducts = {
  product: [
    {
      id: 1,
      name: 'Product 1',
      comment: 'Comment 1',
      quantity: 10,
      company_id: 1,
      company: { id: 1, name: 'Company A' },
    },
    {
      id: 2,
      name: 'Product 2',
      comment: 'Comment 2',
      quantity: 20,
      company_id: 1,
      company: { id: 1, name: 'Company A' },
    },
  ],
};

describe('ProductList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('should display loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<ProductList />);

    expect(screen.getByText('Loading products...')).toBeInTheDocument();
  });

  it('should display products after successful fetch', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve({ data: mockProducts }),
    });

    render(<ProductList />);

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Product 2')).toBeInTheDocument();
    });
  });

  it('should display product details correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve({ data: mockProducts }),
    });

    render(<ProductList />);

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getAllByText('Company A').length).toBeGreaterThan(0);
      expect(screen.getByText('Comment 1')).toBeInTheDocument();
    });
  });

  it('should display error message on fetch failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve({ errors: [{ message: 'Network error' }] }),
    });

    render(<ProductList />);

    await waitFor(() => {
      expect(screen.getByText('Error: Network error')).toBeInTheDocument();
    });
  });

  it('should display "No products found" when product list is empty', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve({ data: { product: [] } }),
    });

    render(<ProductList />);

    await waitFor(() => {
      expect(screen.getByText('No products found.')).toBeInTheDocument();
    });
  });

  it('should have a refresh button when not in realtime mode', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve({ data: mockProducts }),
    });

    render(<ProductList />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
    });
  });

  it('should have a realtime checkbox', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve({ data: mockProducts }),
    });

    render(<ProductList />);

    await waitFor(() => {
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
      expect(screen.getByText('Temps réel (WebSocket)')).toBeInTheDocument();
    });
  });

  it('should refetch products when refresh button is clicked', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ data: mockProducts }),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ data: mockProducts }),
      });

    render(<ProductList />);

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button', { name: 'Refresh' });
    await userEvent.click(refreshButton);

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should render table headers correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve({ data: mockProducts }),
    });

    render(<ProductList />);

    await waitFor(() => {
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Quantity')).toBeInTheDocument();
      expect(screen.getByText('Company')).toBeInTheDocument();
      expect(screen.getByText('Comment')).toBeInTheDocument();
    });
  });
});
