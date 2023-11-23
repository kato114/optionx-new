import { ReactNode } from 'react';
import Link from 'next/link';

interface AppLinkProps {
  name: string;
  to: string;
  children?: ReactNode;
}

const AppLink = ({ name, to, children }: AppLinkProps) => {
  const linkClassName =
    'text-white hover:no-underline hover:text-frost cursor-pointer';

  if (to.startsWith('http')) {
    return (
      <a
        href={to}
        className={children ? '' : linkClassName}
        // 
        rel="noopener noreferrer"
      >
        {children ? children : name}
      </a>
    );
  } else {
    return (
      <Link href={to} passHref>
        <div className={children ? '' : linkClassName}>
          {children ? children : name}
        </div>
      </Link>
    );
  }
};

export default AppLink;
