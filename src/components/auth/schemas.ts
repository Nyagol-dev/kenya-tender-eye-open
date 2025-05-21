
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password_1: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export const signUpSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password_1: z.string().min(6, { message: "Password must be at least 6 characters" }),
  password_2: z.string().min(6, { message: "Password must be at least 6 characters" }),
  user_type: z.enum(['supplier', 'government_entity'], { required_error: "Please select a user type" }),
  full_name: z.string().min(2, { message: "Full name is required" }),
  service_category_id: z.string().optional(),
  entity_name: z.string().optional(),
}).refine(data => data.password_1 === data.password_2, {
  message: "Passwords do not match",
  path: ["password_2"],
}).refine(data => {
    if (data.user_type === 'supplier') return !!data.service_category_id;
    return true;
  }, {
    message: "Service category is required for suppliers",
    path: ["service_category_id"],
  }
).refine(data => {
    if (data.user_type === 'government_entity') return !!data.entity_name && data.entity_name.length > 0;
    return true;
  }, {
    message: "Entity name is required for government entities",
    path: ["entity_name"],
  }
);

export type LoginFormValues = z.infer<typeof loginSchema>;
export type SignUpFormValues = z.infer<typeof signUpSchema>;

