$(function() {
    let qty = $('#js-select-qty').val(),
        price = $('#price-range').val(),
        userId,
        count = 0,
        qtyTotal = 0,
        priceTotal = 0,
        previousQty,
        previousPrice
    ;

    $(document).on('click', '.notification.removable', function() {
        $(this).remove();
    });

    /*
     * Slider
     */
    $('#price-range')
        .on('input', function() {
            $('#price-value').text($(this).val());
        })
        .on('change', function () {
            price = $(this).val();
        })
    ;

    $('#js-select-qty').on('change', function() {
        qty = $(this).val();
    });

    $('#js-button-validate').on('click', function(e) {
        if (typeof  userId === 'undefined') {
            notify('danger','T\'es pas connecté !');

            return;
        }

        let data = {
            "qty": parseFloat(qty),
            "price": parseFloat(price),
            "date": Date.now()
        };

        db.collection('/users').doc(userId).collection('beers').add(data).then(function() {
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
        db.collection('/users').doc(userId).collection('beers').orderBy('date').onSnapshot(function (snapshot) {
            snapshot.docChanges().forEach(function(change) {
                let beer = change.doc.data();

                if (change.type === "added") {
                    qtyTotal += beer.qty;
                    priceTotal += beer.price;
                    ++count;

                    addHistoryRow(beer, change.doc.id);
                }

                if (change.type === 'modified') {
                    qtyTotal = parseInt($('#js-total-qty').text()) - previousQty + beer.qty;
                    priceTotal = parseFloat($('#js-total-price').text()) - previousPrice + beer.price;
                }

                $('#js-total-count').text(count);
                $('#js-total-qty').text(qtyTotal);
                $('#js-total-price').text(priceTotal);
            });
        });
    }

    function notify(type, content) {
        $('.notification.removable').remove();
        $('#app').prepend($('<div/>', {
            'class': 'notification fixed removable is-'+type,
            'text': content
        }).fadeOut(5000, function() {
            $(this).remove();
        }));
    }

    function addHistoryRow(beer, uid) {
        let $row = $('<tr/>', {'class': 'history-row'}),
            $actionTd = $('<td/>', {'data-uid': uid, 'class': 'action-container'});

        addLink($actionTd, 'edit');

        $row
            .append($('<td/>', {text: beer.qty, 'class': 'editable qty'}))
            .append($('<td/>', {text: beer.price, 'class': 'editable price'}))
            .append($('<td/>', {text: (new Date(beer.date)).toLocaleString()}))
            .append($actionTd)
        ;

        $('#history-table').append($row);
    }

    $(document).on('click', '.edit-beer', function(e) {
        e.preventDefault();
        resetActions();

        let $row = $(this).closest('.history-row');

        previousQty = parseInt($('.editable.qty', $row).text());
        previousPrice = parseFloat($('.editable.price', $row).text());

        $('.editable', $row).each(function() {
            $(this).append($('<input/>', {
                value: $(this).text(),
                'class': 'editor'
            }));

        });

        addLink($(this).closest('td'), 'done');
        $('.editor', $('.editable.price')).focus();
    });

    $(document).on('click', '.edit-done', function(e) {
        e.preventDefault();

        let $this = $(this),
            $row = $this.closest('.history-row'),
            newQty = parseFloat($('.qty.editable input', $row).val()),
            newPrice = parseFloat($('.price.editable input', $row).val());

        if (false === validate(newQty) || false === validate(newPrice)) {
            notify('danger', 'Prix ou quantité invalide');
            return;
        }

        db.collection('/users').doc(userId).collection('beers').doc($this.data('uid')).set({
            qty: newQty,
            price: newPrice
        }, {merge: true});

        addLink($this.closest('td'), 'edit');

        $('.editor').remove();
        $('.editable.qty', $row).text(newQty);
        $('.editable.price', $row).text(newPrice);
    });

    $(document).on('keyup', '.editor', function (e) {
        if (13 === e.keyCode) {
            $('.edit-done', $(this).closest('.history-row')).click();
        }
    });

    function addLink($container, type) {
        $('.action', $container).remove();
        $container.append($('<a/>', {
            'class': 'action edit-' + (type === 'edit' ? 'beer' : 'done'),
            href: '#',
            text: (type === 'edit' ? 'Modifier' : 'Ok'),
            'data-uid': $container.data('uid')
        }));
    }

    function resetActions() {
        $('.editor').remove();

        $('.edit-done').each(function() {
            let $actionTd = $('.action-container', $(this).closest('.history-row'));
            addLink($actionTd, 'edit');
        });
    }

    function validate(value) {
        return '' !== value && undefined !== value && null !== value && false === isNaN(value) && value > 0;
    }
});
