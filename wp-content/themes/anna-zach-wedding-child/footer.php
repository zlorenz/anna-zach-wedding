<?php
/**
 * Footer (Child)
 * Clean wedding footer, no blog/layout conditionals, no widgets.
 */
?>

  </main><!-- /#main -->

  <footer id="footer" class="py-4">
    <div class="container">
      <div class="row align-items-center g-3">
        <div class="col-md-6">
          <p class="mb-0">
            <?php
              printf(
                esc_html__( '© %1$s %2$s', 'anna-zach-wedding' ),
                wp_date( 'Y' ),
                get_bloginfo( 'name', 'display' )
              );
            ?>
          </p>
        </div>

        <?php if ( has_nav_menu( 'footer-menu' ) ) : ?>
          <?php
            wp_nav_menu(
              array(
                'container'       => 'nav',
                'container_class' => 'col-md-6',
                'walker'          => new WP_Bootstrap4_Navwalker_Footer(),
                'theme_location'  => 'footer-menu',
                'items_wrap'      => '<ul class="menu nav justify-content-md-end">%3$s</ul>',
              )
            );
          ?>
        <?php endif; ?>

      </div><!-- /.row -->
    </div><!-- /.container -->
  </footer><!-- /#footer -->

</div><!-- /#wrapper -->

<?php wp_footer(); ?>
</body>
</html>