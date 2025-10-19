import React from 'react';

const Card = ({
  children,
  variant = 'default',
  padding = 'default',
  className = '',
  ...props
}) => {
  const baseClasses = 'rounded-lg transition-shadow duration-200';
  
  const variantClasses = {
    default: 'bg-white border border-gray-200 shadow-sm hover:shadow-md',
    elevated: 'bg-white border border-gray-200 shadow-md hover:shadow-lg',
    outlined: 'bg-white border-2 border-gray-300 hover:border-gray-400',
    flat: 'bg-gray-50 border border-gray-200',
  };
  
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8',
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`;

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export default Card;
