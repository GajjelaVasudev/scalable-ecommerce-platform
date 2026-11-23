import React from 'react';
import { Navigate } from 'react-router-dom';

export const AdminDisputesPage: React.FC = () => {
  return <Navigate to="/admin/returns?tab=disputes" replace />;
};
