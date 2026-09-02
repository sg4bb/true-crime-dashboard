-- Opcional: corre esto después de schema.sql para tener casos de prueba en la tabla.

insert into cases (pd, report_number, suspect, incident_type, status, incident_date, charges, rating)
values
  ('Orange PD', '2025-MM-402193-A-O', 'MARTINEZ, DEREK A.', 'Domestic Battery', 'Closed', '2025-03-11', 'Battery (Domestic) x1', 4),
  ('Lee County', '25-MM-020417', 'OKAFOR, JAMES B.', 'Fraud', 'Closed', '2025-01-22', 'Fraud / Scheme to Defraud', 5),
  ('St. Johns', '25000441MMMA', 'REYNARD, KATHERINE M.', 'Child Neglect', 'Ready to Review', '2025-02-02', 'Neglect of a Child', 5);
