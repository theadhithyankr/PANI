import React, { useState } from 'react';
import { Gift, Calendar, Euro, MapPin, Search, Filter, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import OfferDetailModal from '../../components/candidate/OfferDetailModal';
import { candidateOffers } from '../../data/dummyData';

const OffersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'All Offers' },
    { value: 'pending', label: 'Pending' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'declined', label: 'Declined' },
    { value: 'negotiating', label: 'Negotiating' },
    { value: 'expired', label: 'Expired' },
  ];

  const filteredOffers = candidateOffers.filter(offer => {
    const matchesSearch = offer.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         offer.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || offer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'accepted': return 'success';
      case 'declined': return 'error';
      case 'negotiating': return 'info';
      case 'expired': return 'default';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysUntilExpiry = (expiryDate) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleViewOffer = (offer) => {
    setSelectedOffer(offer);
    setShowDetailModal(true);
  };

  const handleAcceptOffer = (offer) => {
    console.log('Accept offer:', offer);
    // Update offer status
  };

  const handleDeclineOffer = (offer) => {
    console.log('Decline offer:', offer);
    // Update offer status
  };

  const handleNegotiateOffer = (offer) => {
    console.log('Negotiate offer:', offer);
    // Open negotiation flow
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Offers</h1>
          <p className="text-gray-600 mt-1">Review and manage your job offers</p>
        </div>
        <Button variant="primary">
          <Gift className="w-4 h-4 mr-2" />
          Offer History
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{candidateOffers.length}</div>
            <div className="text-sm text-gray-600">Total Offers</div>
          </div>
        </Card>
        
        <Card padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {candidateOffers.filter(o => o.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
        </Card>
        
        <Card padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {candidateOffers.filter(o => o.status === 'accepted').length}
            </div>
            <div className="text-sm text-gray-600">Accepted</div>
          </div>
        </Card>
        
        <Card padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              €{candidateOffers.reduce((sum, offer) => sum + offer.compensation.baseSalary, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Value</div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search offers by company or position..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
        <div className="flex gap-4">
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
            className="w-48"
          />
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            More Filters
          </Button>
        </div>
      </div>

      {/* Offers List */}
      <div className="space-y-4">
        {filteredOffers.map((offer) => {
          const daysLeft = getDaysUntilExpiry(offer.expiryDate);
          
          return (
            <Card key={offer.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleViewOffer(offer)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Gift className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{offer.position}</h3>
                    <p className="text-gray-600 font-medium">{offer.companyName}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                      <div className="flex items-center gap-1">
                        <Euro className="w-4 h-4" />
                        €{offer.compensation.baseSalary.toLocaleString()}/year
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Received {formatDate(offer.offerDate)}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {offer.relocationPackage.included ? 'Relocation Included' : 'No Relocation'}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <Badge variant={getStatusColor(offer.status)} size="sm" className="mb-2">
                      {offer.status}
                    </Badge>
                    {offer.status === 'pending' && daysLeft > 0 && (
                      <div className="flex items-center gap-1 text-sm">
                        {daysLeft <= 3 ? (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-gray-500" />
                        )}
                        <span className={daysLeft <= 3 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                          {daysLeft} days left
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {offer.status === 'pending' && (
                      <>
                        <Button variant="primary\" size="sm\" onClick={(e) => {
                          e.stopPropagation();
                          handleAcceptOffer(offer);
                        }}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Accept
                        </Button>
                        <Button variant="outline" size="sm" onClick={(e) => {
                          e.stopPropagation();
                          handleNegotiateOffer(offer);
                        }}>
                          Negotiate
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="sm" onClick={(e) => {
                      e.stopPropagation();
                      handleViewOffer(offer);
                    }}>
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Quick Summary */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Base Salary:</span>
                    <p className="font-medium">€{offer.compensation.baseSalary.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Bonus:</span>
                    <p className="font-medium">€{offer.compensation.bonus.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Equity:</span>
                    <p className="font-medium">{offer.compensation.equity}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Visa Support:</span>
                    <p className="font-medium text-green-600">✓ Included</p>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredOffers.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No offers found</h3>
          <p className="text-gray-600 mb-6">
            {candidateOffers.length === 0 
              ? 'Job offers will appear here when employers extend offers to you.'
              : 'Try adjusting your search or filters to find offers.'
            }
          </p>
          {candidateOffers.length === 0 && (
            <Button variant="primary">
              <Search className="w-4 h-4 mr-2" />
              Browse Jobs
            </Button>
          )}
        </div>
      )}

      {/* Offer Detail Modal */}
      <OfferDetailModal
        offer={selectedOffer}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedOffer(null);
        }}
        onAccept={handleAcceptOffer}
        onDecline={handleDeclineOffer}
        onNegotiate={handleNegotiateOffer}
      />
    </div>
  );
};

export default OffersPage;
