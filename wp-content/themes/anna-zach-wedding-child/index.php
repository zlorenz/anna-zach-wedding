<?php
/**
 * Child theme fallback template.
 * Keep this file small and standard so unexpected template resolution still works.
 */

get_header();

if ( have_posts() ) :
  while ( have_posts() ) :
    the_post();
    ?>
    <main id="primary" class="site-main">
      <div class="container py-5">
        <article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
          <?php the_content(); ?>
        </article>
      </div>
    </main>
    <?php
  endwhile;
endif;

get_footer();

