
import React from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Eye, Edit, Trash2, Phone, Mail, MapPin } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Customer } from '@/hooks/useCustomers';

interface CustomerTableProps {
  customers: Customer[];
  loading: boolean;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onViewDetail: (customer: Customer) => void;
}

const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  loading,
  onEdit,
  onDelete,
  onViewDetail,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: it });
  };

  const getCustomerDisplayName = (customer: Customer) => {
    if (customer.name) return customer.name;
    if (customer.first_name && customer.last_name) {
      return `${customer.first_name} ${customer.last_name}`;
    }
    if (customer.first_name) return customer.first_name;
    if (customer.last_name) return customer.last_name;
    return customer.email || 'Cliente senza nome';
  };

  const getLoyaltyLevel = (score: number) => {
    if (score >= 80) return { label: 'VIP', variant: 'default' as const, color: 'bg-yellow-100 text-yellow-800' };
    if (score >= 60) return { label: 'Premium', variant: 'secondary' as const, color: 'bg-blue-100 text-blue-800' };
    if (score >= 40) return { label: 'Fedele', variant: 'outline' as const, color: 'bg-green-100 text-green-800' };
    return { label: 'Base', variant: 'outline' as const, color: 'bg-gray-100 text-gray-800' };
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex space-x-4">
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="mb-4">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <p>Nessun cliente trovato</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Contatti</TableHead>
            <TableHead>Prima Visita</TableHead>
            <TableHead>Ultima Visita</TableHead>
            <TableHead>Visite</TableHead>
            <TableHead>Spesa Totale</TableHead>
            <TableHead>Spesa Media</TableHead>
            <TableHead>Livello</TableHead>
            <TableHead>Tag</TableHead>
            <TableHead>Azioni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => {
            const loyaltyLevel = getLoyaltyLevel(customer.score);
            
            return (
              <TableRow key={customer.id} className="hover:bg-gray-50">
                <TableCell>
                  <div>
                    <div className="font-medium text-gray-900">
                      {getCustomerDisplayName(customer)}
                    </div>
                    {customer.preferred_dish_category && (
                      <div className="text-sm text-gray-500">
                        Preferisce: {customer.preferred_dish_category}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {customer.email && (
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3 text-gray-400" />
                        {customer.email}
                      </div>
                    )}
                    {customer.phone_number && (
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3 text-gray-400" />
                        {customer.phone_number}
                      </div>
                    )}
                    {customer.city && (
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        {customer.city}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {formatDate(customer.first_visit_date)}
                </TableCell>
                <TableCell className="text-sm">
                  {formatDate(customer.last_visit_date)}
                </TableCell>
                <TableCell>
                  <div className="text-center">
                    <div className="font-medium">{customer.total_visits}</div>
                    <div className="text-xs text-gray-500">visite</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {formatCurrency(customer.total_lifetime_spend)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {formatCurrency(customer.average_spend_per_visit)}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={loyaltyLevel.color}>
                    {loyaltyLevel.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {customer.tags.slice(0, 2).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {customer.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{customer.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetail(customer)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(customer)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(customer)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default CustomerTable;
