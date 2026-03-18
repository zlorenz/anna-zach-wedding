<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
  <meta charset="<?php bloginfo( 'charset' ); ?>">
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
  <?php wp_head(); ?>
</head>

<?php
  $navbar_scheme   = get_theme_mod( 'navbar_scheme', 'navbar-light bg-light' );
  $navbar_position = get_theme_mod( 'navbar_position', 'static' );

  // Optional: hardcode this off for wedding site
  // $search_enabled  = '0';
?>

<body <?php body_class(); ?>>

<?php wp_body_open(); ?>

<a href="#main" class="visually-hidden-focusable">
  <?php esc_html_e( 'Skip to main content', 'anna-zach-wedding' ); ?>
</a>

<div id="wrapper">
  <header>
    <nav id="header"
      class="navbar navbar-expand-md <?php
        echo esc_attr( $navbar_scheme );
        if ( 'fixed_top' === $navbar_position ) {
          echo ' fixed-top';
        } elseif ( 'fixed_bottom' === $navbar_position ) {
          echo ' fixed-bottom';
        }
        if ( is_home() || is_front_page() ) {
          echo ' home';
        }
      ?>">
      <div class="container">

        <a class="navbar-brand" href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home">
          <?php
            $header_logo = get_theme_mod( 'header_logo' );

            if ( ! empty( $header_logo ) ) :
          ?>
              <img src="<?php echo esc_url( $header_logo ); ?>" alt="<?php echo esc_attr( get_bloginfo( 'name', 'display' ) ); ?>" />
          <?php
            else :
              echo esc_html( get_bloginfo( 'name', 'display' ) );
            endif;
          ?>
        </a>

        <button class="navbar-toggler" type="button"
          data-bs-toggle="collapse" data-bs-target="#navbar"
          aria-controls="navbar" aria-expanded="false"
          aria-label="<?php esc_attr_e( 'Toggle navigation', 'anna-zach-wedding' ); ?>">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div id="navbar" class="collapse navbar-collapse">

          <?php
            wp_nav_menu(
              array(
                'menu_class'     => 'navbar-nav ms-auto align-items-md-center gap-md-2',
                'container'      => '',
                'fallback_cb'    => 'WP_Bootstrap_Navwalker::fallback',
                'walker'         => new WP_Bootstrap_Navwalker(),
                'theme_location' => 'main-menu',
              )
            );
          ?>

          <?php
            // RSVP button (expects a page with slug 'rsvp')
            $rsvp_page = get_page_by_path( 'rsvp' );
            if ( $rsvp_page ) :
              $rsvp_url = get_permalink( $rsvp_page->ID );
          ?>
              <a class="btn btn-primary ms-md-3 mt-3 mt-md-0" href="<?php echo esc_url( $rsvp_url ); ?>">
                RSVP
              </a>
          <?php endif; ?>

        </div><!-- /.navbar-collapse -->
      </div><!-- /.container -->
    </nav><!-- /#header -->
  </header>

  <main id="main" class="site-main"<?php
    if ( 'fixed_top' === $navbar_position ) {
      echo ' style="padding-top: 100px;"';
    } elseif ( 'fixed_bottom' === $navbar_position ) {
      echo ' style="padding-bottom: 100px;"';
    }
  ?>>