import React, { useState } from 'react';
import { 
  Trophy, 
  Calendar, 
  Euro, 
  MapPin, 
  Building, 
  Download, 
  FileText, 
  CheckCircle, 
  X, 
  MessageCircle,
  Calculator,
  Home,
  Plane,
  Heart,
  Clock
} from 'lucide-react';
import Card from '../../common/Card';
import Button from '../../common/Button';
import Badge from '../../common/Badge';
import CountdownTimer from '../../common/CountdownTimer';

const OfferReceivedState = ({ application, job }) => {
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decision, setDecision] = useState('');
  const [negotiationNotes, setNegotiationNotes] = useState('');

  const { offer } = application;

  const handleAcceptOffer = () => {
    console.log('Accept offer:', application.id);
    setShowDecisionModal(false);
  };

  const handleDeclineOffer = () => {
    console.log('Decline offer:', application.id);
    setShowDecisionModal(false);
  };

  const handleNegotiateOffer = () => {
    console.log('Negotiate offer:', application.id, negotiationNotes);
    setShowDecisionModal(false);
  };

  const formatSalary = (amount, currency = 'EUR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateTotalCompensation = () => {
    return offer.salary.base + (offer.salary.bonus || 0);
  };

  return (
    <div className="space-y-6">
      {/* Congratulations Hero */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            🎉 Congratulations! 
          </h2>
          <p className="text-lg text-gray-700 mb-4">
            You've received an offer for {offer.position} at {job.company}
          </p>
          
          {/* Countdown Timer */}
          <div className="flex justify-center mb-4">
            <CountdownTimer 
              targetDate={offer.expiryDate}
              variant="warning"
              size="lg"
              onExpire={() => console.log('Offer expired!')}
            />
          </div>
          
          <p className="text-sm text-gray-600">
            Offer expires on {new Date(offer.expiryDate).toLocaleDateString()}
          </p>
        </div>
      </Card>

      {/* Offer Summary */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Offer Summary</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Position Details */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Building className="w-5 h-5 text-gray-400" />
              <div>
                <h4 className="font-medium text-gray-900">{offer.position}</h4>
                <p className="text-sm text-gray-600">{offer.department}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <h4 className="font-medium text-gray-900">Start Date</h4>
                <p className="text-sm text-gray-600">
                  {new Date(offer.startDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <h4 className="font-medium text-gray-900">Location</h4>
                <p className="text-sm text-gray-600">{job.location}</p>
              </div>
            </div>
          </div>

          {/* Compensation Overview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Euro className="w-5 h-5 text-green-500 mr-2" />
              Total Compensation
            </h4>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Base Salary:</span>
                <span className="font-medium">
                  {formatSalary(offer.salary.base, offer.salary.currency)}
                </span>
              </div>
              
              {offer.salary.bonus > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Annual Bonus:</span>
                  <span className="font-medium">
                    {formatSalary(offer.salary.bonus, offer.salary.currency)}
                  </span>
                </div>
              )}
              
              {offer.salary.equity && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Equity:</span>
                  <span className="font-medium">{offer.salary.equity}</span>
                </div>
              )}
              
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900">Total Package:</span>
                  <span className="font-bold text-green-600">
                    {formatSalary(calculateTotalCompensation(), offer.salary.currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Detailed Compensation */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Compensation Breakdown</h3>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <Euro className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900">Base Salary</h4>
            <p className="text-xl font-bold text-green-600">
              {formatSalary(offer.salary.base, offer.salary.currency)}
            </p>
            <p className="text-sm text-gray-600">Annual</p>
          </div>
          
          {offer.salary.bonus > 0 && (
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900">Performance Bonus</h4>
              <p className="text-xl font-bold text-yellow-600">
                {formatSalary(offer.salary.bonus, offer.salary.currency)}
              </p>
              <p className="text-sm text-gray-600">Annual Target</p>
            </div>
          )}
          
          {offer.salary.equity && (
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <Calculator className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900">Equity</h4>
              <p className="text-xl font-bold text-blue-600">{offer.salary.equity}</p>
              <p className="text-sm text-gray-600">Stock Options</p>
            </div>
          )}
        </div>
      </Card>

      {/* Benefits Package */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Benefits Package</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          {offer.benefits.map((benefit, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-900">{benefit}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Relocation Package */}
      {offer.relocation?.included && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Home className="w-6 h-6 text-blue-500 mr-2" />
            Relocation Support
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Relocation Bonus:</span>
                <span className="font-medium">
                  {formatSalary(offer.relocation.bonus, offer.salary.currency)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Temporary Housing:</span>
                <span className="font-medium">{offer.relocation.temporaryHousing}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Flight Tickets:</span>
                <span className="font-medium">
                  {offer.relocation.flightTickets ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <X className="w-5 h-5 text-red-500" />
                  )}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Visa Support:</span>
                <span className="font-medium">
                  {offer.relocation.visaSupport ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <X className="w-5 h-5 text-red-500" />
                  )}
                </span>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Relocation Timeline</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Visa application support begins immediately</li>
                <li>• Temporary housing arranged before arrival</li>
                <li>• Relocation bonus paid with first salary</li>
                <li>• Local integration support provided</li>
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Offer Documents */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Offer Documents</h3>
        
        <div className="space-y-3">
          {offer.documents.map((doc, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="w-8 h-8 text-gray-400" />
                <div>
                  <h4 className="font-medium text-gray-900">{doc.name}</h4>
                  <p className="text-sm text-gray-600">
                    {doc.type === 'offer_letter' && 'Official offer letter with terms'}
                    {doc.type === 'contract' && 'Employment contract to review and sign'}
                    {doc.type === 'benefits' && 'Complete benefits package details'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge variant={doc.status === 'ready' ? 'success' : 'warning'}>
                  {doc.status}
                </Badge>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            📄 Please review all documents carefully before making your decision. 
            You can download and save these documents for your records.
          </p>
        </div>
      </Card>

      {/* Decision Actions */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Make Your Decision</h3>
        
        <div className="grid md:grid-cols-3 gap-4">
          <Button 
            variant="primary" 
            className="bg-green-600 hover:bg-green-700 py-3"
            onClick={() => {
              setDecision('accept');
              setShowDecisionModal(true);
            }}
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Accept Offer
          </Button>
          
          <Button 
            variant="outline" 
            className="py-3"
            onClick={() => {
              setDecision('negotiate');
              setShowDecisionModal(true);
            }}
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Negotiate Terms
          </Button>
          
          <Button 
            variant="outline" 
            className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400 py-3"
            onClick={() => {
              setDecision('decline');
              setShowDecisionModal(true);
            }}
          >
            <X className="w-5 h-5 mr-2" />
            Decline Offer
          </Button>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm">
              <Clock className="w-4 h-4 mr-2" />
              Request Extension
            </Button>
            
            <Button variant="ghost" size="sm">
              <Calculator className="w-4 h-4 mr-2" />
              Compare with Other Offers
            </Button>
          </div>
        </div>
      </Card>

      {/* Next Steps */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">What Happens Next?</h3>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
              <span className="text-xs font-medium text-blue-600">1</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Review and Decide</h4>
              <p className="text-sm text-gray-600">
                Take time to review the offer details, discuss with family/advisors if needed
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
              <span className="text-xs font-medium text-blue-600">2</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Sign Documents</h4>
              <p className="text-sm text-gray-600">
                Once accepted, sign and return the employment contract and related documents
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
              <span className="text-xs font-medium text-blue-600">3</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Background Check & Visa</h4>
              <p className="text-sm text-gray-600">
                Complete background verification and begin visa application process if needed
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
              <span className="text-xs font-medium text-blue-600">4</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Onboarding</h4>
              <p className="text-sm text-gray-600">
                Start your onboarding process and prepare for your first day
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Decision Modal */}
      {showDecisionModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowDecisionModal(false)} />
            
            <div className="inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {decision === 'accept' && 'Accept Offer'}
                  {decision === 'negotiate' && 'Negotiate Offer'}
                  {decision === 'decline' && 'Decline Offer'}
                </h3>
                
                {decision === 'accept' && (
                  <div>
                    <p className="text-gray-600 mb-6">
                      You're about to accept the offer for {offer.position} at {job.company}. 
                      This will start the onboarding process.
                    </p>
                  </div>
                )}
                
                {decision === 'negotiate' && (
                  <div>
                    <p className="text-gray-600 mb-4">
                      What aspects of the offer would you like to discuss?
                    </p>
                    <textarea
                      value={negotiationNotes}
                      onChange={(e) => setNegotiationNotes(e.target.value)}
                      placeholder="e.g., salary, start date, benefits, remote work options..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                    />
                  </div>
                )}
                
                {decision === 'decline' && (
                  <div>
                    <p className="text-gray-600 mb-6">
                      Are you sure you want to decline this offer? This action cannot be undone.
                    </p>
                  </div>
                )}
                
                <div className="flex space-x-3">
                  <Button variant="outline" onClick={() => setShowDecisionModal(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={
                      decision === 'accept' ? handleAcceptOffer :
                      decision === 'negotiate' ? handleNegotiateOffer :
                      handleDeclineOffer
                    }
                    className={`flex-1 ${
                      decision === 'accept' ? 'bg-green-600 hover:bg-green-700' :
                      decision === 'decline' ? 'bg-red-600 hover:bg-red-700' : ''
                    }`}
                  >
                    {decision === 'accept' && 'Accept Offer'}
                    {decision === 'negotiate' && 'Send Negotiation'}
                    {decision === 'decline' && 'Decline Offer'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfferReceivedState;
