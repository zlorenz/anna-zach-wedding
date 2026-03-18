<?php
/**
 * Default Page Template (Child)
 * Clean, no sidebar, Bootstrap container layout.
 */

get_header();

if ( have_posts() ) :
  while ( have_posts() ) :
    the_post();
    ?>

    <div class="container py-5">
      <article id="post-<?php the_ID(); ?>" <?php post_class('content'); ?>>

        <?php if ( ! is_front_page() ) : ?>
          <header class="entry-header mb-4">
            <h1 class="entry-title"><?php the_title(); ?></h1>
          </header>
        <?php endif; ?>

        <div class="entry-content">
          <?php
            the_content();
            wp_link_pages(
              array(
                'before'   => '<nav class="page-links" aria-label="' . esc_attr__( 'Page', 'anna-zach-wedding-child' ) . '">',
                'after'    => '</nav>',
                'pagelink' => esc_html__( 'Page %', 'anna-zach-wedding-child' ),
              )
            );
          ?>
        </div>

        <?php
          edit_post_link(
            esc_html__( 'Edit', 'anna-zach-wedding-child' ),
            '<p class="edit-link mt-4">',
            '</p>'
          );
        ?>

      </article>
    </div>

    <?php
  endwhile;
endif;

get_footer();