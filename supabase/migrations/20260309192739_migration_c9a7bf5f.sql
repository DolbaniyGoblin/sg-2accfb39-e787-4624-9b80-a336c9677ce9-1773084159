-- Create policy to allow users to insert their own profile during registration
CREATE POLICY "Users can insert their own profile during registration"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);