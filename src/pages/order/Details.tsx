import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { OrderLayout } from "@/components/order/OrderLayout";
import { OrderSummaryCard } from "@/components/order/OrderSummaryCard";
import { countries } from "@/data/countries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrder } from "@/contexts/OrderContext";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  country: z.string().trim().min(1, "Country is required").max(100),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  acceptedTerms: z.boolean().refine((v) => v === true, { message: "You must accept the terms" }),
});

type FormValues = z.infer<typeof schema>;

export default function Details() {
  const navigate = useNavigate();
  const { state, setDetails } = useOrder();

  const defaultValues = useMemo<FormValues>(
    () => ({
      name: state.details.name,
      email: state.details.email,
      country: state.details.country,
      company: state.details.company ?? "",
      acceptedTerms: state.details.acceptedTerms,
    }),
    [state.details],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  return (
    <OrderLayout title="Your Details" step="details" sidebar={<OrderSummaryCard showEstPrice={false} />}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              className="space-y-5"
              onSubmit={form.handleSubmit((values) => {
                setDetails(values);
                navigate("/order/subscription");
              })}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} autoComplete="name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} autoComplete="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {countries.map((c) => (
                            <SelectItem key={c.code} value={c.name}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} autoComplete="organization" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="acceptedTerms"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-start gap-3 rounded-lg border p-4">
                      <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(Boolean(v))} />
                      <div className="space-y-1">
                        <FormLabel className="leading-none">I agree to the terms</FormLabel>
                        <p className="text-sm text-muted-foreground">You can update details later in dashboard.</p>
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between gap-3">
                <Button type="button" variant="outline" onClick={() => navigate("/order/choose-design")}>
                  Back
                </Button>
                <Button type="submit" size="lg">
                  Continue to Subscription
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </OrderLayout>
  );
}
