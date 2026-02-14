export type ComplaintStatus = 'Open' | 'Assigned' | 'In Progress' | 'On Hold' | 'Closed (Pending)' | 'Closed';
export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';
export type Category =
  | 'Electrical'
  | 'IT Support'
  | 'Plumbing'
  | 'Carpentry'
  | 'Interior Works'
  | 'Exterior Works'
  | 'Masonry'
  | 'Painting'
  | 'Flooring'
  | 'HVAC'
  | 'Network'
  | 'Building Construction'
  | 'Other';

export interface Complaint {
  id: string;
  dateTime: string;
  store: string;
  department: string;
  category: Category;
  subCategory?: string;
  description: string;
  priority: Priority;
  status: ComplaintStatus;
  reportedBy: string;
  assignedTo?: string;
  contactNumber: string;
  expectedResolution?: string;
  actualResolution?: string;
  remarks?: string;
  closureApproval?: boolean;
}

export const CATEGORIES: Category[] = [
  'Electrical', 'IT Support', 'Plumbing', 'Carpentry',
  'Interior Works', 'Exterior Works', 'Masonry', 'Painting',
  'Flooring', 'HVAC', 'Network', 'Building Construction', 'Other',
];

export const PRIORITIES: Priority[] = ['Low', 'Medium', 'High', 'Critical'];

export const STATUSES: ComplaintStatus[] = [
  'Open', 'Assigned', 'In Progress', 'On Hold', 'Closed (Pending)', 'Closed',
];

export const STORES = [
  'Retail Store – Mumbai',
  'Retail Store – Delhi',
  'Retail Store – Bangalore',
  'Retail Store – Chennai',
  'Retail Store – Hyderabad',
  'Retail Store – Kolkata',
  'Warehouse – Pune',
  'Head Office – Mumbai',
];

export const DEPARTMENTS = [
  'Sales Floor', 'Back Office', 'Warehouse', 'Customer Service',
  'Admin', 'IT', 'Security', 'Facilities',
];
