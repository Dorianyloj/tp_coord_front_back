import CompanyList from '@/components/CompanyList';
import ProductList from '@/components/ProductList';

export default function DashboardPage() {
    return (
        <div className="container mx-auto p-8 text-black">
            <h1 className="text-3xl font-bold mb-8">Dashboard - GraphQL avec Types</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CompanyList />
                <ProductList />
            </div>
        </div>
    );
}
