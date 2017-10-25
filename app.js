$(function() {
    let qty,
        price,
        userId,
        qtyTotal = 0,
        priceTotal = 0
    ;

    $(document).on('click', '.notification', function() {
        $(this).remove();
    });

    $('.js-button-qty').on('click', function(e) {
        e.preventDefault();
        qty = $(this).data('qty');
        $("[disabled]", '#prices').removeAttr('disabled');
        $('.js-button-qty').removeClass('is-outlined');
        $(this).addClass('is-outlined');
    });

    $('.js-button-price').on('click', function(e) {
        e.preventDefault();
        price = $(this).data('price');
        $('#js-button-validate').removeAttr('disabled');
        $('.js-button-price').removeClass('is-outlined');
        $(this).addClass('is-outlined');
    });

    $('#js-custom-price').on('keyup', function() {
        let value = parseFloat($(this).val());

        if (isNaN(value)) {
            return;
        }

        price = value;
        $('#js-button-validate').removeAttr('disabled');
    });

    $('#js-button-validate').on('click', function(e) {
        let data = {
            "qty": qty,
            "price": price
        };

        db.ref('users/'+userId).push(data).then(function() {
            $('.js-button-price', '#prices').attr('disabled', true);
            $('#js-button-validate').attr('disabled', true);
            $('#js-custom-price').val('').attr('disabled', true);
            $('.js-button-qty, .js-button-price').removeClass('is-outlined');
        }).catch(function() {
            // add notif, permission denied
            addNotif('danger', 'Login first');
        });
    });

    /* SECURITY */
    $('#js-facebook-login').on('click', function(e) {
        e.preventDefault();

        var provider = new firebase.auth.FacebookAuthProvider();
        firebase.auth().languageCode = 'fr_FR';
        firebase.auth().signInWithRedirect(provider);
    });

    $('#js-facebook-logout').on('click', function() {
        firebase.auth().signOut().then(function() {
            addNotif('success', 'Logged out');
        }).catch(function(error) {
            addNotif('danger', 'Error while logging out');
            console.log(error);
        });
    });

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            userId = user.displayName;
            $('#js-facebook-login').hide();
            $('#js-facebook-logout').show();

            handleData();
        } else {
            $('#js-facebook-login').show();
            $('#js-facebook-logout').hide();
        }
    });

    function handleData() {
        db.ref('/users/'+userId).on('child_added', function(data) {
            let beer = data.val();

            qtyTotal += beer.qty;
            priceTotal += beer.price;

            $('#js-total-qty').text(qtyTotal);
            $('#js-total-price').text(priceTotal);
        });
    }

    function addNotif(type, content) {
        $('.notification').remove();
        $('#app').prepend($('<div/>', {
            'class': 'notification is-'+type,
            'text': content
        }));
    }
});
