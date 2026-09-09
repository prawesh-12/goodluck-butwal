import { requireActor } from "@/lib/auth/session";
import { allow } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { TestimonialForm, type TestimonialValues } from "@/features/testimonials/components/testimonial-form";
import { editorialOptions } from "@/features/posts/admin-queries";

export const dynamic = "force-dynamic";

const empty: TestimonialValues = {
  type: "text",
  authorName: "",
  displayName: "",
  isAnonymised: false,
  authorPhotoId: "",
  authorLocation: "",
  quote: "",
  bodyHtml: "",
  imageId: "",
  videoUrl: "",
  videoProvider: "",
  destinationId: "",
  institutionId: "",
  serviceId: "",
  officeId: "",
  rating: null,
  isFeatured: false,
  status: "draft",
  publishedAt: "",
};

export default async function NewTestimonialPage() {
  const actor = await requireActor();
  allow(actor, "testimonials", "create");

  const options = await editorialOptions();

  return (
    <>
      <h1 className="t-h4">Add a story</h1>
      <TestimonialForm
        values={empty}
        options={options}
        photo={null}
        image={null}
        canPublish={can(actor, "testimonials", "publish")}
        canDelete={false}
      />
    </>
  );
}
