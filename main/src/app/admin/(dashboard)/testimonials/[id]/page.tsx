import { notFound } from "next/navigation";
import { requireActor } from "@/lib/session";
import { allow, allowOwn } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { TestimonialForm } from "@/components/admin/testimonial-form";
import { pickedMedia } from "@/server/queries/admin-people";
import { editorialOptions, getAdminTestimonial } from "@/server/queries/admin-editorial";

export const dynamic = "force-dynamic";

export default async function EditTestimonialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireActor();
  allow(actor, "testimonials", "update");

  const { id } = await params;
  const story = await getAdminTestimonial(id);
  if (!story) notFound();
  allowOwn(actor, story);

  const [options, media] = await Promise.all([
    editorialOptions(),
    pickedMedia([story.authorPhotoId, story.imageId]),
  ]);

  return (
    <>
      <h1 className="t-h4">{story.displayName || "Story"}</h1>
      <p className="t-small admin-help">
        <a href="/success-stories" target="_blank" rel="noreferrer">
          View on site
        </a>
      </p>

      <TestimonialForm
        values={{
          id: story.id,
          type: story.type,
          authorName: story.authorName ?? "",
          displayName: story.displayName ?? "",
          isAnonymised: story.isAnonymised,
          authorPhotoId: story.authorPhotoId ?? "",
          authorLocation: story.authorLocation ?? "",
          quote: story.quote ?? "",
          bodyHtml: story.bodyHtml ?? "",
          imageId: story.imageId ?? "",
          videoUrl: story.videoUrl ?? "",
          videoProvider: story.videoProvider ?? "",
          destinationId: story.destinationId ?? "",
          institutionId: story.institutionId ?? "",
          serviceId: story.serviceId ?? "",
          officeId: story.officeId ?? "",
          rating: story.rating,
          isFeatured: story.isFeatured,
          consentGiven: story.consentGiven,
          consentNote: story.consentNote ?? "",
          status: story.status,
          publishedAt: story.publishedAt ? story.publishedAt.toISOString().slice(0, 16) : "",
        }}
        options={options}
        photo={media.get(story.authorPhotoId ?? "") ?? null}
        image={media.get(story.imageId ?? "") ?? null}
        canPublish={can(actor, "testimonials", "publish")}
        canDelete={can(actor, "testimonials", "delete")}
      />
    </>
  );
}
