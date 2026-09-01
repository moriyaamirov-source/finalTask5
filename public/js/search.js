document.addEventListener(
    'DOMContentLoaded',
    () => {

        function escapeHtml(value) {
            return String(value || '')
                .replaceAll('&', '&amp;')
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;')
                .replaceAll('"', '&quot;')
                .replaceAll("'", '&#039;');
        }


        async function doSearch(
            formId,
            endpoint,
            statusId,
            resultsId
        ) {
            const form =
                document.getElementById(
                    formId
                );

            const status =
                document.getElementById(
                    statusId
                );

            const results =
                document.getElementById(
                    resultsId
                );


            form.addEventListener(
                'submit',
                async event => {

                    event.preventDefault();

                    results.innerHTML = '';

                    status.className = '';

                    status.textContent =
                        'טוען...';


                    const formData =
                        new FormData(form);

                    const params =
                        new URLSearchParams();


                    // לא שולחים שדות ריקים
                    for (
                        const [key, value]
                        of formData.entries()
                    ) {
                        if (
                            String(value)
                                .trim() !== ''
                        ) {
                            params.append(
                                key,
                                value
                            );
                        }
                    }


                    try {

                        const response =
                            await fetch(
                                `${endpoint}?${params.toString()}`,
                                {
                                    credentials:
                                        'include'
                                }
                            );


                        const data =
                            await response.json();


                        if (!response.ok) {
                            throw new Error(
                                data.message ||
                                'Search failed'
                            );
                        }


                        const posts =
                            Array.isArray(data)
                                ? data
                                : (
                                    data.posts ||
                                    []
                                );


                        if (
                            posts.length === 0
                        ) {
                            status.textContent =
                                'לא נמצאו תוצאות';

                            status.className =
                                'empty';

                            return;
                        }


                        status.textContent =
                            `נמצאו ${posts.length} תוצאות:`;


                        posts.forEach(post => {

                            const div =
                                document.createElement(
                                    'article'
                                );

                            div.className =
                                'post';


                            const author =
                                post.author?.username ||
                                'לא ידוע';


                            div.innerHTML = `
                                <h3>
                                    ${escapeHtml(post.title || 'ללא כותרת')}
                                </h3>

                                <p>
                                    ${escapeHtml(post.content || '')}
                                </p>

                                <small>
                                    מחבר/ת:
                                    ${escapeHtml(author)}
                                </small>
                            `;


                            results.appendChild(
                                div
                            );
                        });


                    } catch (error) {

                        console.error(
                            'Search error:',
                            error
                        );

                        status.textContent =
                            error.message ||
                            'שגיאה בחיפוש';

                        status.className =
                            'error';
                    }
                }
            );
        }


        doSearch(
            'advForm',
            '/posts/search/advanced',
            'advStatus',
            'advResults'
        );


        doSearch(
            'filterForm',
            '/posts/search/filter',
            'filterStatus',
            'filterResults'
        );
    }
);