const deleteProduct = async (btn) => {
    const prodId = btn.parentNode.querySelector('[name=prodId]').value
    const csrf = btn.parentNode.querySelector('[name=_csrf]').value

    const productElement = btn.closest('article')

    const result = await fetch('/admin/delete-product/' + prodId, {
        method: 'DELETE',
        headers: { 
            'csrf-token': csrf
        }
    })
    productElement.remove()

    console.log(result);
}