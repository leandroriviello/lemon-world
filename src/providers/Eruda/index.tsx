'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

const Eruda = dynamic(() => import('./eruda-provider').then((c) => c.Eruda), {
  ssr: false,
});

export const ErudaProvider = (props: { children: ReactNode }) => {
  // Activar Eruda temporalmente para debugging en producción
  // if (process.env.NODE_ENV === 'production') {
  //   return props.children;
  // }
  return <Eruda>{props.children}</Eruda>;
};
