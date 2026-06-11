from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.experience_submission import ExperienceSubmission


async def get_approved_experience_insights(
    db: AsyncSession,
    majors: list[str],
    limit_per_major: int = 2,
) -> dict[str, list[dict[str, str | int | None]]]:
    if not majors:
        return {}

    rows = (
        await db.scalars(
            select(ExperienceSubmission)
            .where(ExperienceSubmission.is_approved.is_(True))
            .where(ExperienceSubmission.current_major.in_(majors))
            .order_by(ExperienceSubmission.created_at.desc())
        )
    ).all()

    grouped: dict[str, list[dict[str, str | int | None]]] = {major: [] for major in majors}
    for row in rows:
        entries = grouped.setdefault(row.current_major or "Unknown", [])
        if len(entries) >= limit_per_major:
            continue
        entries.append(
            {
                "contributor_type": row.contributor_type,
                "university": row.university,
                "job_title": row.job_title,
                "satisfaction_score": row.satisfaction_score,
                "would_recommend": row.would_recommend,
                "why_choose_text": row.why_choose_text,
                "challenges_text": row.challenges_text,
                "advice_text": row.advice_text,
            }
        )
    return grouped


def flatten_experience_insights(insights: dict[str, list[dict]]) -> str:
    blocks = []
    for major, items in insights.items():
        if not items:
            continue
        lines = [f"Major: {major}"]
        for item in items:
            lines.append(
                " | ".join(
                    filter(
                        None,
                        [
                            f"type={item.get('contributor_type')}",
                            f"university={item.get('university')}",
                            f"job={item.get('job_title')}",
                            f"satisfaction={item.get('satisfaction_score')}",
                            f"recommend={item.get('would_recommend')}",
                            f"why={item.get('why_choose_text')}",
                            f"challenge={item.get('challenges_text')}",
                            f"advice={item.get('advice_text')}",
                        ],
                    )
                )
            )
        blocks.append("\n".join(lines))
    return "\n\n".join(blocks) if blocks else "No approved experience insights yet."
