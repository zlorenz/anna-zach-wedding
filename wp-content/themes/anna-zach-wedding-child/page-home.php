<?php
/**
 * Template Name: Home
 * Description: Homepage template with full-width hero + CTAs + Gutenberg content.
 */

get_header();

if ( have_posts() ) :
  while ( have_posts() ) :
    the_post();

    // Featured image as hero background (optional)
    $hero_bg_url = '';
    if ( has_post_thumbnail() ) {
      $img = wp_get_attachment_image_src( get_post_thumbnail_id(), 'full' );
      if ( ! empty( $img[0] ) ) {
        $hero_bg_url = $img[0];
      }
    }

    // Page links
    $rsvp_page   = get_page_by_path( 'rsvp' );
    $travel_page = get_page_by_path( 'travel-accommodation' ); // NOTE: adjust slug if yours differs
    $rsvp_url   = $rsvp_page ? get_permalink( $rsvp_page->ID ) : home_url( '/rsvp/' );
    $travel_url = $travel_page ? get_permalink( $travel_page->ID ) : '#';

    // Customize these anytime (or we can move them to Customizer/ACF later)
    $event_date      = 'December 2026';
    $event_location  = 'Nha Trang, Vietnam';
    $rsvp_deadline   = 'TBD';
    ?>

    <!-- HERO (full width) -->
    <section class="az-hero text-white">
      <div class="az-hero-bg"<?php if ( $hero_bg_url ) : ?>
        style="background-image: url('<?php echo esc_url( $hero_bg_url ); ?>');"
      <?php endif; ?>></div>

      <div class="az-hero-overlay"></div>

      <div class="container py-5">
        <div class="row">
          <div class="col-lg-8">

            <p class="az-hero-kicker mb-2"><?php echo esc_html( $event_location ); ?></p>
            <h1 class="az-hero-title mb-3"><?php echo esc_html( get_bloginfo( 'name', 'display' ) ); ?></h1>
            <p class="az-hero-subtitle mb-4"><?php echo esc_html( $event_date ); ?></p>

            <div class="d-flex flex-column flex-sm-row gap-3">
              <a class="btn btn-primary btn-lg" href="<?php echo esc_url( $rsvp_url ); ?>">RSVP</a>
              <?php if ( $travel_url !== '#' ) : ?>
                <a class="btn btn-outline-light btn-lg" href="<?php echo esc_url( $travel_url ); ?>">Travel & Accommodation</a>
              <?php endif; ?>
            </div>

          </div>
        </div>
      </div>
    </section>

    <!-- QUICK INFO -->
    <section class="py-5">
      <div class="container">
        <div class="row g-4">
          <div class="col-md-4">
            <div class="card h-100">
              <div class="card-body">
                <h2 class="h6 text-uppercase mb-2">Date</h2>
                <div class="fs-5"><?php echo esc_html( $event_date ); ?></div>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card h-100">
              <div class="card-body">
                <h2 class="h6 text-uppercase mb-2">Location</h2>
                <div class="fs-5"><?php echo esc_html( $event_location ); ?></div>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card h-100">
              <div class="card-body">
                <h2 class="h6 text-uppercase mb-2">RSVP By</h2>
                <div class="fs-5"><?php echo esc_html( $rsvp_deadline ); ?></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- GUTENBERG CONTENT -->
    <section class="pb-5">
      <div class="container">
        <div class="row">
          <div class="col-lg-10">
            <div class="entry-content">
              <?php the_content(); ?>
            </div>
          </div>
        </div>
      </div>
    </section>

    <?php
  endwhile;
endif;

get_footer();