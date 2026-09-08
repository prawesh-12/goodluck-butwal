import { requireActor } from "@/lib/session";
import { allow } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { TestimonialForm, type TestimonialValues } from "@/components/admin/testimonial-form";
import { editorialOptions } from "@/server/queries/admin-editorial";

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
  consentGiven: false,
  consentNote: "",
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
