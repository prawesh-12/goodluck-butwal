import { notFound } from "next/navigation";
import { requireActor } from "@/lib/auth/session";
import { allow, allowOwn } from "@/lib/auth/guard";
import { can } from "@/lib/auth/rbac";
import { TestimonialForm } from "@/features/testimonials/components/testimonial-form";
import { pickedMedia } from "@/features/media/picked-media-map";
import { editorialOptions } from "@/features/posts/admin-queries";
import { getAdminTestimonial } from "@/features/testimonials/admin-queries";

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
