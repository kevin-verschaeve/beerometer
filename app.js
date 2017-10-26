$(function() {
    let qty,
        price,
        userId,
        count = 0,
        qtyTotal = 0,
        priceTotal = 0
    ;

    $(document).on('click', '.notification.removable', function() {
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
        let value = parseFloat($(this).val().replace(',', '.'));

        if (isNaN(value)) {
            return;
        }

        price = value;
        $('#js-button-validate').removeAttr('disabled');
    });

    $('#js-button-validate').on('click', function(e) {
        let data = {
            "qty": qty,
            "price": price,
            "date": Date.now()
        };

        db.ref('users/'+userId).push(data).then(function() {
            $('.js-button-price', '#prices').attr('disabled', true);
            $('#js-button-validate').attr('disabled', true);
            $('#js-custom-price').val('').attr('disabled', true);
            $('.js-button-qty, .js-button-price').removeClass('is-outlined');

            notify('success', 'Bravo ! T\'as encore bu une bière !');
        }).catch(function() {
            notify('danger', 'Tu dois te connecter avant !');
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
            notify('success', 'Bravo t\'es déconnecté ! Champion !');
        }).catch(function(error) {
            notify('danger', 'Hmm... Y\'a eu une erreur pendant la déconnexion. Réssaye stp.');
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

            $('#app').prepend($('<div/>', {
                'class': 'notification is-warning',
                'text': 'Tu dois te connecter pour picoler. C\'est véridique hein !'
            }));
        }
    });

    function handleData() {
        db.ref('/users/'+userId).orderByChild('date').on('child_added', function(data) {
            let beer = data.val();

            qtyTotal += beer.qty;
            priceTotal += beer.price;
            ++count;

            addHistoryRow(beer);

            $('#js-total-count').text(count);
            $('#js-total-qty').text(qtyTotal);
            $('#js-total-price').text(priceTotal);
        });
    }

    function notify(type, content) {
        $('.notification.removable').remove();
        $('#app').prepend($('<div/>', {
            'class': 'notification removable is-'+type,
            'text': content
        }).fadeOut(5000, function() {
            $(this).remove();
        }));
    }

    function addHistoryRow(beer) {
        let $row = $('<tr/>');
        $row
            .append($('<td/>', {text: beer.qty}))
            .append($('<td/>', {text: beer.price}))
            .append($('<td/>', {text: (new Date(beer.date)).toLocaleString()}))
        ;
        $('#history-table').append($row);
    }
});
