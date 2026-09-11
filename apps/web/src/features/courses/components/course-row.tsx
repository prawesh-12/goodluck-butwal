import { Link } from "@/components/ui/link";
import { Appear } from "@/components/ui/appear";
import { Chip } from "@/components/ui/bits";
import type { PublicCourse } from "@/features/courses/queries";

export function CourseRow({ course, delay = 0 }: { course: PublicCourse; delay?: number }) {
  const place = [course.institution, course.city, course.destination || course.country].filter(Boolean).join(" · ");
  return (
    <Appear delay={delay} className="w-full">
      <Link
        href={`/courses/${course.slug}`}
        className="flex w-full flex-col items-start gap-[10px] rounded-[10px] bg-surface p-5 ring-1 ring-transparent transition-colors duration-300 hover:bg-white hover:ring-hairline md:rounded-[20px] md:p-[30px]"
      >
        <div className="flex flex-wrap items-center gap-[10px]">
          {course.level && <Chip tone="white">{course.level}</Chip>}
          {course.category && <Chip tone="white">{course.category}</Chip>}
          {course.duration && <Chip tone="white">{course.duration}</Chip>}
        </div>
        <h3 className="t-h5">{course.name}</h3>
        {place && <p className="t-base text-muted">{place}</p>}
        {(course.fee || course.intakes.length > 0) && (
          <p className="t-small text-muted">
            {[course.fee && `Tuition ${course.fee}`, course.intakes.length > 0 && `Intakes: ${course.intakes.join(", ")}`].filter(Boolean).join(" · ")}
          </p>
        )}
      </Link>
    </Appear>
  );
}
