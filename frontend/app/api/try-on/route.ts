import { NextResponse } from "next/server"
import { auth0 } from "@/lib/auth0"
import { replicate } from "@/lib/replicate"

const CATEGORY_MAP: Record<string, string> = {
  tops: "upper_body",
  outerwear: "upper_body",
  bottoms: "lower_body",
}

export async function POST(req: Request) {
  const session = await auth0.getSession()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { personImage, garmentUrl, category } = await req.json()

  if (!personImage || !garmentUrl) {
    return NextResponse.json(
      { error: "personImage and garmentUrl are required" },
      { status: 400 },
    )
  }

  const garmentCategory = CATEGORY_MAP[category] ?? "upper_body"

  const output = await replicate.run("cuuupid/idm-vton:c871bb9b046c1b1f6aba0df18c65c741c953d5da4c2a545f0529db3e3f94bd12", {
    input: {
      human_img: personImage,
      garm_img: garmentUrl,
      category: garmentCategory,
    },
  })

  // output is a URL string or ReadableStream — extract the URL
  const resultUrl = typeof output === "string" ? output : String(output)

  return NextResponse.json({ resultUrl })
}
