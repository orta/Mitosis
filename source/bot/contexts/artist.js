// @flow

import { fbapi } from "../../facebook/api"
import { metaphysicsQuery, gravityPost } from "../artsy-api"
import { elementForArtwork } from "./artworks"
import type { MitosisUser } from "../types"

export function elementForArtist(artist: any) {
  const url = `https://artsy.net${artist.href}`
  return {
    title: artist.name,
    subtitle: artist.blurb,
    item_url: url,
    image_url: artist.images[0].url,
    buttons: [{
      type: "web_url",
      url: url,
      title: "Open on Artsy"
    }, {
      type: "postback",
      title: "Follow",
      payload: `artist_follow::${artist.id}::${artist.title}`
    }]
  }
}

export async function callbackForShowingArtist(context: MitosisUser, payload: string) {
  const [, artistID, artistName] = payload.split("::")
  const artistIDAndName = artistID + "::" + artistName

  // TODO: Get Gene deets for Artist
  // TODO: Get Show deets?
  // TODO: Get a few artworks

  const geneIDAndName = "geneID::Gene Name"

  fbapi.startTyping(context.fbSenderID)
  const data = await metaphysicsQuery(artistQuery(artistID), context)

  await fbapi.elementCarousel(context.fbSenderID, data.data.artist.artworks.map(a => elementForArtwork(a)))
  await fbapi.quickReply(context.fbSenderID, `About ${artistName}`, [
    { content_type: "text", title: "Favourite", payload: `favourite-artist::${artistIDAndName}` },
    { content_type: "text", title: `About ${artistName}`, payload: `show-artist::${artistIDAndName}` },
    { content_type: "text", title: "Related Articles", payload: `open-gene::${geneIDAndName}` },
    { content_type: "text", title: "More Artworks", payload: `show-artist-artworks::${artistIDAndName}` }
  ])
  await fbapi.stopTyping(context.fbSenderID)
}

export async function callbackForSavingArtist(context: MitosisUser, payload: string) {
  const [, artistID] = payload.split("::")
  await gravityPost({ artist_id: artistID }, "/api/v1/me/follow/artist", context)
}

const artistQuery = (artistID: string) => `
{
  artist(id:"${artistID}") {
    id
    blurb
    image {
      url(version: "square")
    }
    shows(active: true) {
      id
      is_displayable
      is_active
    }
    artworks(size: 5, sort: iconicity_desc, published: true) {
      id
      title
      description
      images {
        url
      }
    }
    articles{
      title,
      href
      thumbnail_image {
        url
      }
    }
    artists {
      name
    }
  }
}
`
