import { ReactNode } from 'react';
import {
  LoaderFunction,
  ActionFunction,
  IndexRouteObject,
} from 'react-router-dom';

export default interface GenericRouteConfig {
  index?: boolean; // ✅ Include this!
id?:string;
  path?: string;
  element?: ReactNode;
  loader?: LoaderFunction;
  action?: ActionFunction;
  errorElement?: ReactNode;
  children?: GenericRouteConfig[];
}