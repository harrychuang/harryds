import type { Schema, Struct } from '@strapi/strapi';

export interface FeedHeading extends Struct.ComponentSchema {
  collectionName: 'components_feed_headings';
  info: {
    displayName: 'heading';
  };
  attributes: {
    content: Schema.Attribute.String & Schema.Attribute.Required;
    level: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 3;
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<1>;
  };
}

export interface FeedImage extends Struct.ComponentSchema {
  collectionName: 'components_feed_images';
  info: {
    displayName: 'image';
  };
  attributes: {
    alt: Schema.Attribute.String;
    image: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'> &
      Schema.Attribute.Required;
  };
}

export interface FeedList extends Struct.ComponentSchema {
  collectionName: 'components_feed_lists';
  info: {
    displayName: 'list';
  };
  attributes: {
    items: Schema.Attribute.JSON & Schema.Attribute.Required;
  };
}

export interface FeedParagraph extends Struct.ComponentSchema {
  collectionName: 'components_feed_paragraphs';
  info: {
    displayName: 'paragraph';
  };
  attributes: {
    content: Schema.Attribute.Blocks & Schema.Attribute.Required;
  };
}

export interface FeedVideo extends Struct.ComponentSchema {
  collectionName: 'components_feed_videos';
  info: {
    displayName: 'video';
  };
  attributes: {
    alt: Schema.Attribute.String;
    autoplay: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    controls: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    loop: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    muted: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    poster: Schema.Attribute.Media<'images'>;
    video: Schema.Attribute.Media<'videos'> & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'feed.heading': FeedHeading;
      'feed.image': FeedImage;
      'feed.list': FeedList;
      'feed.paragraph': FeedParagraph;
      'feed.video': FeedVideo;
    }
  }
}
