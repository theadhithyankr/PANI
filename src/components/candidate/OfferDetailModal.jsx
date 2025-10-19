import React, { useState } from 'react';
import { X, Euro, Calendar, FileText, MapPin, Users, CheckCircle, Clock, AlertTriangle, Download, Edit } from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Card from '../common/Card';

const OfferDetailModal = ({ offer, isOpen, onClose, onAccept, onDecline, onNegotiate }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [negotiationNote, setNegotiationNote] = useState('');

  if (!isOpen || !offer) return null;

  const tabs = [
    { id: 'overview', label: 'Offer Overview' },
    { id: 'compensation', label: 'Compensation' },
    { id: 'relocation', label: 'Relocation' },
    { id: 'documents', label: 'Documents' },
  ];

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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysUntilExpiry = () => {
    const expiryDate = new Date(offer.expiryDate);
    const today = new Date();
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysLeft = getDaysUntilExpiry();

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Offer Header */}
      <Card>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{offer.position}</h3>
            <p className="text-lg text-gray-600">{offer.companyName}</p>
            <p className="text-sm text-gray-500">Offer received on {formatDate(offer.offerDate)}</p>
          </div>
          <Badge variant={getStatusColor(offer.status)} size="sm">
            {offer.status}
          </Badge>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Euro className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">
              €{offer.compensation?.baseSalary?.toLocaleString() || 'N/A'}
            </div>
            <div className="text-sm text-green-800">Base Salary</div>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">{daysLeft}</div>
            <div className="text-sm text-blue-800">Days to Respond</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <MapPin className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-lg font-bold text-purple-600">
              {offer.relocationPackage?.included ? 'Full Support' : 'Not Included'}
            </div>
            <div className="text-sm text-purple-800">Relocation Package</div>
          </div>
        </div>
      </Card>

      {/* Expiry Warning */}
      {daysLeft <= 7 && daysLeft > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-900">Offer Expires Soon</h4>
              <p className="text-sm text-yellow-800">
                This offer expires on {formatDate(offer.expiryDate)}. 
                Please respond within {daysLeft} day{daysLeft !== 1 ? 's' : ''}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Summary */}
      <Card>
        <h4 className="font-semibold text-gray-900 mb-4">Offer Summary</h4>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Base Salary:</span>
              <span className="font-medium">€{offer.compensation?.baseSalary?.toLocaleString() || 'N/A'}/year</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Annual Bonus:</span>
              <span className="font-medium">€{offer.compensation?.bonus?.toLocaleString() || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Equity:</span>
              <span className="font-medium">{offer.compensation?.equity || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Visa Support:</span>
              <span className="font-medium text-green-600">
                {offer.visaSupport?.included ? '✓ Included' : 'Not Included'}
              </span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Relocation Package:</span>
              <span className="font-medium text-green-600">
                {offer.relocationPackage?.included ? '✓ Full Support' : 'Not Included'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Moving Allowance:</span>
              <span className="font-medium">€{offer.relocationPackage?.amount?.toLocaleString() || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Temporary Housing:</span>
              <span className="font-medium">{offer.relocationPackage?.temporaryAccommodation || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Housing Assistance:</span>
              <span className="font-medium text-green-600">
                {offer.relocationPackage?.included ? '✓ Included' : 'Not Included'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Next Steps */}
      {offer.nextSteps && offer.nextSteps.length > 0 && (
        <Card>
          <h4 className="font-semibold text-gray-900 mb-4">Next Steps</h4>
          <div className="space-y-3">
            {offer.nextSteps.map((step, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                  {index + 1}
                </div>
                <span className="text-gray-700">{step}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );

  const renderCompensation = () => (
    <div className="space-y-6">
      {/* Total Compensation */}
      <Card>
        <h4 className="font-semibold text-gray-900 mb-4">Total Compensation Package</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div>
              <h5 className="font-medium text-green-900">Base Salary</h5>
              <p className="text-sm text-green-700">Annual gross salary</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-green-600">
                €{offer.compensation?.baseSalary?.toLocaleString() || 'N/A'}
              </div>
              <div className="text-sm text-green-700">per year</div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div>
              <h5 className="font-medium text-blue-900">Performance Bonus</h5>
              <p className="text-sm text-blue-700">Annual performance-based bonus</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-blue-600">
                €{offer.compensation?.bonus?.toLocaleString() || 'N/A'}
              </div>
              <div className="text-sm text-blue-700">target amount</div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
            <div>
              <h5 className="font-medium text-purple-900">Equity Package</h5>
              <p className="text-sm text-purple-700">Stock options vesting over 4 years</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-purple-600">
                {offer.compensation?.equity || 'N/A'}
              </div>
              <div className="text-sm text-purple-700">of company</div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900">Total Annual Value</span>
              <span className="text-2xl font-bold text-gray-900">
                €{((offer.compensation?.baseSalary || 0) + (offer.compensation?.bonus || 0)).toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">Plus equity and benefits</p>
          </div>
        </div>
      </Card>

      {/* Benefits */}
      {offer.compensation?.benefits && offer.compensation.benefits.length > 0 && (
        <Card>
          <h4 className="font-semibold text-gray-900 mb-4">Benefits & Perks</h4>
          <div className="grid md:grid-cols-2 gap-4">
            {offer.compensation.benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-gray-900">{benefit}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Salary Breakdown */}
      <Card>
        <h4 className="font-semibold text-gray-900 mb-4">Monthly Breakdown (Estimated)</h4>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Gross Monthly Salary:</span>
            <span className="font-medium">€{Math.round((offer.compensation?.baseSalary || 0) / 12).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Income Tax (approx.):</span>
            <span className="font-medium text-red-600">-€{Math.round((offer.compensation?.baseSalary || 0) * 0.25 / 12).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Social Security (approx.):</span>
            <span className="font-medium text-red-600">-€{Math.round((offer.compensation?.baseSalary || 0) * 0.15 / 12).toLocaleString()}</span>
          </div>
          <div className="border-t border-gray-200 pt-2">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-900">Net Monthly (approx.):</span>
              <span className="font-bold text-green-600">€{Math.round((offer.compensation?.baseSalary || 0) * 0.6 / 12).toLocaleString()}</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          * Tax calculations are estimates. Actual amounts may vary based on personal circumstances.
        </p>
      </Card>
    </div>
  );

  const renderRelocation = () => (
    <div className="space-y-6">
      {/* Relocation Overview */}
      <Card>
        <h4 className="font-semibold text-gray-900 mb-4">Relocation Support Package</h4>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <h5 className="font-medium text-gray-900">Visa Sponsorship</h5>
                <p className="text-sm text-gray-600">Complete EU Blue Card support</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <h5 className="font-medium text-gray-900">Moving Allowance</h5>
                <p className="text-sm text-gray-600">€{offer.relocationPackage?.amount?.toLocaleString() || 'N/A'} for relocation expenses</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <h5 className="font-medium text-gray-900">Temporary Housing</h5>
                <p className="text-sm text-gray-600">{offer.relocationPackage?.temporaryAccommodation || 'N/A'} in corporate housing</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <h5 className="font-medium text-gray-900">Housing Search</h5>
                <p className="text-sm text-gray-600">Dedicated agent to find permanent housing</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <h5 className="font-medium text-gray-900">Legal Support</h5>
                <p className="text-sm text-gray-600">Assistance with bureaucracy and registration</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <h5 className="font-medium text-gray-900">Family Support</h5>
                <p className="text-sm text-gray-600">School search and partner job assistance</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Timeline */}
      <Card>
        <h4 className="font-semibold text-gray-900 mb-4">Relocation Timeline</h4>
        <div className="space-y-4">
          {[
            { phase: 'Offer Acceptance', duration: '1 week', description: 'Sign contract and begin visa process' },
            { phase: 'Visa Application', duration: '2-4 weeks', description: 'Prepare and submit documents' },
            { phase: 'Processing', duration: '6-12 weeks', description: 'Embassy review and decision' },
            { phase: 'Relocation', duration: '2-4 weeks', description: 'Move to Germany and start work' },
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h5 className="font-medium text-gray-900">{item.phase}</h5>
                  <span className="text-sm text-gray-500">{item.duration}</span>
                </div>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Support Services */}
      <Card>
        <h4 className="font-semibold text-gray-900 mb-4">Included Support Services</h4>
        <div className="space-y-3">
          {[
            { service: 'Visa application assistance', description: 'Complete support through EU Blue Card process' },
            { service: 'Airport pickup', description: 'Transportation from airport to temporary housing' },
            { service: 'Bank account setup', description: 'Assistance opening German bank account' },
            { service: 'City registration (Anmeldung)', description: 'Help with mandatory registration process' },
            { service: 'Tax registration', description: 'Support with German tax number application' },
            { service: 'Health insurance setup', description: 'Guidance on German health insurance options' },
            { service: 'Mobile phone contract', description: 'Assistance with German mobile phone plans' },
            { service: 'Language classes (optional)', description: 'German language course recommendations' },
          ].map((item, index) => (
            <div key={index} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <h5 className="font-medium text-gray-900">{item.service}</h5>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderDocuments = () => (
    <div className="space-y-6">
      {/* Document Status */}
      {offer.documents && offer.documents.length > 0 ? (
        <Card>
          <h4 className="font-semibold text-gray-900 mb-4">Offer Documents</h4>
          <div className="space-y-4">
            {offer.documents.map((doc, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <div>
                    <h5 className="font-medium text-gray-900">{doc.name}</h5>
                    <p className="text-sm text-gray-600 capitalize">{doc.type} document</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge 
                    variant={doc.status === 'signed' ? 'success' : 'warning'} 
                    size="sm"
                  >
                    {doc.status.replace('_', ' ')}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card>
          <h4 className="font-semibold text-gray-900 mb-4">Offer Documents</h4>
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Documents will be available once the offer is finalized.</p>
          </div>
        </Card>
      )}

      {/* E-Signature Process */}
      <Card>
        <h4 className="font-semibold text-gray-900 mb-4">Electronic Signature Process</h4>
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="font-medium text-blue-900 mb-2">How it works</h5>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Review all documents carefully</li>
              <li>2. Click "Accept Offer" to begin signing process</li>
              <li>3. Sign documents electronically using DocuSign</li>
              <li>4. Receive signed copies via email</li>
              <li>5. HR will contact you within 24 hours</li>
            </ol>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div>
              <h5 className="font-medium text-green-900">Legally Binding</h5>
              <p className="text-sm text-green-700">Electronic signatures are legally equivalent to handwritten signatures in Germany</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Important Notes */}
      <Card>
        <h4 className="font-semibold text-gray-900 mb-4">Important Information</h4>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h5 className="font-medium text-yellow-900">Review Period</h5>
              <p className="text-sm text-yellow-800">
                You have until {formatDate(offer.expiryDate)} to accept this offer. 
                Take time to review all documents and ask questions.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
            <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h5 className="font-medium text-blue-900">Questions?</h5>
              <p className="text-sm text-blue-800">
                Contact HR at hr@techcorp.com or your recruiter if you have any questions 
                about the offer or need clarification on any terms.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'compensation': return renderCompensation();
      case 'relocation': return renderRelocation();
      case 'documents': return renderDocuments();
      default: return renderOverview();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="inline-block w-full max-w-5xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="relative p-6 bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-200">
            <Button variant="ghost" onClick={onClose} className="absolute top-4 right-4">
              <X className="w-6 h-6" />
            </Button>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Job Offer</h1>
                <p className="text-lg text-gray-600">{offer.position} at {offer.companyName}</p>
                <div className="flex items-center gap-4 mt-2">
                  <Badge variant={getStatusColor(offer.status)} size="sm">
                    {offer.status}
                  </Badge>
                  {daysLeft > 0 && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      {daysLeft} days left to respond
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[600px] overflow-y-auto">
            {renderTabContent()}
          </div>

          {/* Footer Actions */}
          {offer.status === 'pending' && (
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <Button variant="outline" onClick={() => onDecline(offer)}>
                Decline Offer
              </Button>
              
              <Button variant="primary" onClick={() => onAccept(offer)}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Accept Offer
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfferDetailModal;
