import React from 'react';
import Image from 'next/image';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-24 h-24 text-2xl',
  xl: 'w-32 h-32 text-4xl',
};

export const Avatar: React.FC<AvatarProps> = ({ src, name = '', size = 'md', className = '' }) => {
  const getInitials = (n: string) => {
    if (!n) return '?';
    const split = n.trim().split(' ');
    if (split.length === 1) return split[0].charAt(0).toUpperCase();
    return (split[0].charAt(0) + split[split.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <div className={`relative inline-flex items-center justify-center overflow-hidden rounded-full bg-blue-100 text-blue-600 font-semibold border-2 border-white shadow-sm shrink-0 ${sizeClasses[size]} ${className}`}>
      {src ? (
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          unoptimized
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
};
