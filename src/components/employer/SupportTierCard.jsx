import React from 'react';
import { CheckCircle, Check } from 'lucide-react';

const SupportTierCard = React.memo(({ tier, isSelected, onSelect }) => {
  const getColorClasses = (color) => {
    switch(color) {
      case 'blue':
        return {
          border: isSelected ? 'border-blue-400' : 'border-blue-200',
          bg: isSelected ? 'bg-blue-50' : 'bg-white',
          accent: 'text-blue-600',
          saveTag: 'bg-blue-100 text-blue-700'
        };
      case 'violet':
        return {
          border: isSelected ? 'border-primary-400' : 'border-primary-200',
          bg: isSelected ? 'bg-primary-50' : 'bg-white',
          accent: 'text-primary-600',
          saveTag: 'bg-primary-100 text-primary-700'
        };
      case 'orange':
        return {
          border: isSelected ? 'border-orange-400' : 'border-orange-200',
          bg: isSelected ? 'bg-orange-50' : 'bg-white',
          accent: 'text-orange-600',
          saveTag: 'bg-orange-100 text-orange-700'
        };
      default:
        return {
          border: isSelected ? 'border-gray-400' : 'border-gray-200',
          bg: isSelected ? 'bg-gray-50' : 'bg-white',
          accent: 'text-gray-600',
          saveTag: 'bg-gray-100 text-gray-700'
        };
    }
  };

  const colors = getColorClasses(tier.color);

  return (
    <div
      className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg ${colors.border} ${colors.bg}`}
      onClick={() => onSelect(tier.value)}
    >
      {/* Header with popular tag */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div>
            {tier.popular && (
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${colors.saveTag}`}>
                MOST POPULAR
              </span>
            )}
          </div>
        </div>
        
        {isSelected && (
          <div className="flex items-center gap-2 text-primary-600">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Selected</span>
          </div>
        )}
      </div>

      {/* Price section */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold ${colors.accent}`}>{tier.price}</span>
          {tier.period && (
            <span className="text-gray-600 text-lg">{tier.period}</span>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-1">{tier.subtitle}</p>
      </div>

      {/* Description */}
      <p className="text-gray-700 mb-4 text-sm leading-relaxed">{tier.description}</p>

      {/* Features */}
      <ul className="space-y-2">
        {tier.features.map((feature, index) => (
          <li key={index} className="flex items-center gap-3">
            <Check className={`w-4 h-4 ${colors.accent} flex-shrink-0`} />
            <span className="text-gray-700 text-sm">{feature}</span>
          </li>
        ))}
      </ul>

      {/* See more link (bottom right) */}
      <div className="absolute bottom-6 right-6">
        <button 
          className="text-gray-500 text-sm hover:text-gray-700 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            // Handle see more action
          }}
        >
          See more
        </button>
      </div>
    </div>
  );
});

export default SupportTierCard; 