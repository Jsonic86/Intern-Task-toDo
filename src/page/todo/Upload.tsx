import React, { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { configurePnP, getSp } from "../../msal/pnpSetup";

const UploadFile: React.FC = () => {
    // const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

    // useEffect(() => {
    //     // Token này có thể đã hết hạn, hãy lấy token mới từ SharePoint
    //     const accessToken = "eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwia2lkIjoiTnR2T2dPQWlrbThJTE1ReEM3ZGdKT3lJbGcyQ2hERktJN210aE9SaVlMRSIsInhtc19oZF91dGkiOiJVY21RQ1BzZVJrR0ttSXdBTFgtMUFBIiwieG1zX2hkX2lhdCI6IjE3NTAyOTY4MzIifQ..scjxcIA9fy4ZHt2B28VfGQ.u0udFyOvjgOWbtSoY3OxFT2V4p6hSBjieQaDOIqKxKjx83SO9zUgRegfSwDE4qrlqscY0V0o2Fu-ADbe5roh3YVFp9VwaWofH9dLehdRHZoTX1d_K40L9SHldL4Y1j9MQCIvmr9CTKeAsKYhyhdkz39BmvSMAWxU2BLKJfdI2FlLgtug_50JxH6Nb_gzjm14Z3u-1pbm5za_Cr0icYCvRlAcZY4s1lDcgXPCPVcuwadr58yUzS1M9fBtzsYspt9l6i2EeqXTNgifpJpgiLRQ53NpQfQwfDWw6avCakXwJz-WwUP-vEWzsj3n58qiZKY_j7LmDI7sl9tIEggexEC3EOgnGQ9h6_dhoI8hI9WzIa98ba5wb3s7RP1pNlVPhXLlD7e6TQc6tbuolCf9TpyyfwdZeNgkgmRA8UZeGYoXbPbUCWXUyzPk1avPFM7zY_3tX-TFZUJCOoEFruedJr5Z93qpVaK0iHFOdU4BGdxwdti03vGrVGp66S7hpxAFhiIyrW1JXcbZuTr4GtRutzENrup1QJNY-yR41ozcQtYLxAwVqe1kJq2Y-qdx2Vu31AcaZ_Lm5Y6BdUJ7D9kILa9GRKE8W9RU6YFh-r4sxf5LGYmmQhE1aCzoydK1fl0_ElkUnDzH5wvbLTlZKNkeSi_wFI1fCW_cfptcmCp-O7NxQvvwQEj7uSLK5_FYXMPjd89cr7SZPfYGfCrSUFHbp2M9lmGdli19RoXmbE6KaX-sQxLjiADyTfceFt7aDd9WyrUdLyuZUYG0ZahRzykuQLGayHuG2sN-11zZCt6wFk3nULaWJqlJIvWfDjxXA5yf6ZxpVwFEhK6LDDTrAjwGHEO1S47AuPvCN8NUg8eIk3Fr0WO16p7FBipu0MCkiPJcC2EwmnKE_7WKJkYMmszDW7UaEmzRTaLSdmQdgApMHWwwJYQJAQ7O3HfBmyfZRPwTJeWQR-BVQkHwHfAFvNgKdSA4TGkX3a5NyZ_DToTnEZFd8-hS23IDNqJIHo-SRmHQfxbYexuAIaPDh85b7BR_iFP6iCiVHv58u-UxeJ4a4uU_wOTidlcWF3F4ijB5cyOxCKncFrbqwKEWsvQ8GVlZm-Gl9YV_aMPOKdVbonkMg-nNwLjz0KLyMqw3jUSGe2-AbKqm-d5cbk5jyG2wyHLJwNjoe-JcJ5pKYq7NSGgPnz1hQqqPxzAv1Su6gyspXvtHgzSxWaj5d68hvNYFCUnTIA9XKyJ1GV8Lnbm-Pw0NuYJA1cZE_pyCkRJeXWKqo5HkC8JVFuyrIFN9hfRUzzJKF0WgFmTVwYM6xzOEirKRvG7ijVo4eRZFDfUkrxj7pHqFRBoCSowZ1Y1d2O774qvVLCvbCrNuOLH6Z9oKRgOtC9M8OoB9cWtu9dlYsBXuXVur3SUJSoKowjK_EHZtP4P5ObjKwXbgHLd2eALHWarkNRX9ppi7eAykxuVI2j3oKBgLnoZWEcQe3aEMVBcPpkdP_7UbkPV3xvvn0vVPzOhQ9D_HpOjMyx9nJf0hYZFXYyK7dBHFxFzoyHQY_iGHDJsX4OK1_eGvJZ8cIqInp7IVKZoGuDo80CJujwctt6UXJ2IeTLf9CbKoRx2wT2k41y9p6jTrwb9S4VDSPNAQrrqegcxqAYnJo2Fiq8ZlXYj-G6zrc6vVLUD22GJHdN19NXvaprfBlemoReqHLr8Ua8T94MlkyHtY9PJXrJM0NEUwdqbjmaemJORNUoaru5JG7KG0pUTyaPlbPvXNhZo_ka6z3izbQuPnQ4fSCdR8a62eYsKOBzOHWZh-V_-emotFvNNbaQworBCxTj2Dh71oJjPy5cYvz0v4GlKo0ly28ZrISQF-3v3jz12aIqYhOs7flLzY0ko3L3LrpNLALbLgOuHLOEgxL5LS176Po4j2u0ez04UcsWOzp9wa3CUlghrzXC4He87n_CGv9huY88tQR25C59GiRYotoEJvLLRuJDi0c8ntsMdTh_zFOkg88N_VbBlQBlOhg1a3B9Dvq1outJtbS6SaijUMie16wDHjU1RkxqFrXsXcPtEPyXmgFe_PmeqMPLpA2UoxWuDni-4AV0VNzgahms-n0cigCXrV6bQjT17rZ1z_mqnNhigIH0X4ys2kLYs7sSNtRx6X4CleR0ZKf9Y3aEPfgJXK7DyYuqnjaHhKI2t-xMlBt09-j6NdS0POTD7OkM1TkHEkw84zD5uvAujG9HzVwTZchDNfhqQjcuCw7B_1qURCOnE1MLyAiIv2ozOc5LdmT_rvhBk2dhjavLOQX4wi_jkf62Ax8YSLstt8TigXKzQh62AwkLx1GToQ1DQ-BSWVK6MPzYEwbGW8GBfntKJhZvxwQYp5dd-UJGhJZfAtz74lQ90YlXlSAyj6eQOB1J4okb3G84LbcdWqX04ftR6mTGeaxd49IsCmZOyCuNvBAJ5LPdasV0VhMl1yiRuDuh-5ph2-6o40cnoGhaQ7kmclNW2H5BRfYevDxAaok0TAaJ3fSVBDrOkwGVxemCMKFKKsuFH5NyUaiz7saPkkmrS3PLtGSyF68rqb37w4vUymHIujxg8CtdlHw7sFQ_lCrKIup-gJgEcu9ZT7DeCqiwEnOKgJzipk0ZTCIxFRaPbeJCZv8-ZrmOuKyJXaaY53YiKpgweq9SO-wXY9sNRyojsLTV9ZtU9oDpD8bC6XjYDhUCcxug0sTZ8JUfM_qoI8pXevPYdAvOEqMmMl5qTT6QOJqHkz9gXSKlaiP8TttlC-zwKZlrOmk9nKvbiwj6VxSQUMpaPVBDqNaxSKAf00M1P1WlIvNiXMPNlKajnSQpYq_er9kl_8LCuBa7CDvqTUmZJFJ7BKPzu3FwS79r8f43f4vrVAjk_6CrjIKypNlu3xsRrqlbjero1R_OLXbl7vpf-VA0DFOVVUZQ7ReWZ-Ez8KkCfU4cKeG4SCIqsw6Fzw.H7SQEfRtyveWbrr2BYmTLNQLDvNZa14h5PnHxEwd6Yk"; // Cập nhật token mới
    //     configurePnP(accessToken);
    // }, []);

    // const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    //     const file = e.target.files?.[0];
    //     if (!file) return;

    //     const sp = getSp();
    //     const arrayBuffer = await file.arrayBuffer();

    //     try {
    //         const uploadResult = await sp.web
    //             .getFolderByServerRelativePath("/sites/intern-data/thetv")
    //             .files.addUsingPath(file.name, arrayBuffer, { Overwrite: true });

    //         setUploadedUrl(`https://1work.sharepoint.com${uploadResult.ServerRelativeUrl}`);
    //     } catch (err) {
    //         console.error("Upload failed", err);
    //     }
    // };

    return (
        <div style={{ padding: 20 }}>
            {/* <h2>Upload File to SharePoint</h2>
             <input type="file" onChange={handleUpload} />
            {uploadedUrl && ( 
                 <p>
                     <a href={uploadedUrl} target="_blank" rel="noopener noreferrer">
                         {uploadedUrl}
                     </a>
                 </p>
             )}*/}
        </div>
    );
};

export default UploadFile;
