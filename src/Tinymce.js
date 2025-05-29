
import React, { useState, useRef, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import Cropper from 'cropperjs';
import './App.css';

function Tinymce() {
  const [content, setContent] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const editorRef = useRef(null);
  const cropperRef = useRef(null);
  const contentRef = useRef(null);
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [cropCallback, setCropCallback] = useState(null);
  const imagePreviewRef = useRef(null);

  const handleEditorChange = (content, editor) => setContent(content);

  const openCropper = (file, callback) => {
    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result);
      setCropCallback(() => callback);
      setCropModalVisible(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCrop = () => {
    if (cropperRef.current && typeof cropperRef.current.getCroppedCanvas === 'function') {
      const croppedCanvas = cropperRef.current.getCroppedCanvas();
      const croppedImage = croppedCanvas.toDataURL('image/png');
      cropCallback(croppedImage, { alt: 'Cropped Image' });
      setUploadStatus('Image cropped and inserted!');
      closeCropper();
    } else {
      setUploadStatus('Error: Cropper not initialized.');
    }
  };

  const closeCropper = () => {
    if (cropperRef.current) {
      cropperRef.current.destroy();
      cropperRef.current = null;
    }
    setCropModalVisible(false);
    setImageToCrop(null);
    setCropCallback(null);
  };

  const filePickerCallback = (callback, value, meta) => {
    if (meta.filetype === 'image') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = () => {
        const file = input.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            callback(reader.result, { alt: file.name });
            setUploadStatus('Image inserted successfully!');
          };
          reader.readAsDataURL(file);
        } else {
          setUploadStatus('No image selected.');
        }
      };
      input.click();
    } else if (meta.filetype === 'media') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'video/mp4,video/webm,video/ogg';
      input.onchange = () => {
        const file = input.files[0];
        if (file) {
          if (file.size > 10 * 1024 * 1024) {
            setUploadStatus('Warning: Video file is larger than 10MB. It may not play correctly as a Data URL.');
          }
          const reader = new FileReader();
          reader.onload = () => {
            let mimeType = 'video/mp4';
            if (file.name.endsWith('.webm')) {
              mimeType = 'video/webm';
            } else if (file.name.endsWith('.ogg')) {
              mimeType = 'video/ogg';
            }
            callback(reader.result, {
              source1: reader.result,
              title: file.name,
              poster: '',
              width: '640',
              height: '360',
              mimeType: mimeType,
            });
            setUploadStatus('Video inserted successfully!');
          };
          reader.readAsDataURL(file);
        } else {
          setUploadStatus('No video selected.');
        }
      };
      input.click();
    }
  };

  const convertToPDF = () => {
    if (contentRef.current && window.html2pdf) {
      const element = contentRef.current;
      const opt = {
        margin: 1,
        filename: 'editor-content.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] },
      };
      window.html2pdf().set(opt).from(element).save().then(() => {
        setUploadStatus('PDF generated successfully!');
      }).catch((err) => {
        setUploadStatus('Error generating PDF: ' + err.message);
      });
    } else {
      setUploadStatus('Error: PDF library not loaded or content not found.');
    }
  };

  const printContent = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Editor Content</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              img, video { max-width: 100%; height: auto; }
              .custom-pagebreak {
                display: block;
                height: 0;
                margin: 20px 0;
                border: 0;
                border-top: 1px dashed #ccc;
                page-break-before: always;
                break-before: page;
              }
              @media print {
                .custom-pagebreak {
                  page-break-before: always !important;
                  break-before: page !important;
                }
              }
            </style>
          </head>
          <body>
            ${content}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    } else {
      setUploadStatus('Error: Unable to open print window.');
    }
  };

  useEffect(() => {
    if (cropModalVisible && imagePreviewRef.current && !cropperRef.current) {
      cropperRef.current = new Cropper(imagePreviewRef.current, {
        aspectRatio: NaN,
        viewMode: 1,
        responsive: true,
      });
    }
    return () => {
      if (cropperRef.current) {
        cropperRef.current.destroy();
        cropperRef.current = null;
      }
    };
  }, [cropModalVisible]);

  return (
    <div style={{ width: '1200px', margin: '50px auto', border: '1px solid #ccc', borderRadius: '4px' }}>
      <div style={{ padding: '10px', background: '#f0f0f0' }}>
        <h2 style={{ margin: 0 }}>TinyMCE Editor</h2>
      </div>

      {uploadStatus && (
        <span
          style={{
            color: uploadStatus.toLowerCase().includes('error') ? 'red' : 'green',
            padding: '0 10px',
          }}
        >
          {uploadStatus}
        </span>
      )}

      <Editor
        apiKey="vh7y7ogsbihx5x4m9wpo68hopa398afzwauuiq7cc0py1su0" 
        onInit={(evt, editor) => { editorRef.current = editor }}
        initialValue="<p>Start typing...</p>"
        init={{
          height: 500,
          menubar: 'file edit insert view format table tools help',
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'media',
            'table', 'code', 'preview', 'fullscreen', 'emoticons',
            'codesample', 'insertdatetime', 'charmap', 'searchreplace',
            'visualblocks', 'visualchars', 'wordcount', 'autosave',
            'quickbars', 'accordion', 'pagebreak'
          ],
          toolbar:
            'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | ' +
            'alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | ' +
            'link image media | code preview fullscreen | cropimage | ' +
            'insertdatetime charmap searchreplace visualblocks visualchars wordcount | ' +
            'accordion accordionremove | quickimage quicktable emoticons | pagebreak | printeditor convertpdf',
          file_picker_types: 'image media',
          file_picker_callback: filePickerCallback,
          media_live_embeds: true,
          video_template_callback: (data) => {
            return `<video width="${data.width}" height="${data.height}" controls ${
              data.poster ? `poster="${data.poster}"` : ''
            }>\n` +
                   `<source src="${data.source1}" type="${data.mimeType || 'video/mp4'}">\n` +
                   `Your browser does not support the video tag.\n` +
                   `</video>`;
          },
          autosave_interval: '30s',
          autosave_retention: '2m',
          image_advtab: true,
          quickbars_selection_toolbar: 'bold italic | quicklink h2 h3 blockquote quickimage quicktable',
          quickbars_insert_toolbar: 'quickimage quicktable',
          browser_spellcheck: true,
          content_style: `
            .custom-pagebreak {
              display: block;
              height: 0;
              margin: 20px 0;
              border: 0;
              border-top: 1px dashed #ccc;
              page-break-before: always;
              break-before: page;
            }
            @media print {
              .custom-pagebreak {
                page-break-before: always !important;
                break-before: page !important;
              }
            }
            /* Style for misspelled words */
            span[spellcheck="true"] {
              text-decoration: red wavy underline;
            }
          `,
          setup: (editor) => {
            // Custom buttons
            editor.ui.registry.addButton('convertpdf', {
              text: 'Convert to PDF',
              onAction: convertToPDF,
            });

            editor.ui.registry.addButton('printeditor', {
              text: 'Print',
              onAction: printContent,
            });

            editor.ui.registry.addButton('cropimage', {
              text: 'Crop Image',
              onAction: () => {
                const input = document.createElement('input');
                input.setAttribute('type', 'file');
                input.setAttribute('accept', 'image/*');
                input.onchange = () => {
                  const file = input.files[0];
                  if (file) {
                    openCropper(file, (croppedImage, meta) => {
                      editor.insertContent(`<img src="${croppedImage}" alt="${meta.alt}" />`);
                    });
                  }
                };
                input.click();
              },
            });
          },
        }}
        onEditorChange={handleEditorChange}
      />


      {cropModalVisible && (
        <div className="cropper-modal">
          <div className="cropper-container">
            <h3>Crop Image</h3>
            <img ref={imagePreviewRef} src={imageToCrop} alt="To Crop" style={{ maxWidth: '100%' }} />
            <div className="cropper-controls">
              <button onClick={handleCrop}>Crop & Insert</button>
              <button onClick={closeCropper}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'none' }}>
        <div ref={contentRef} dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    </div>
  );
}

export default Tinymce;