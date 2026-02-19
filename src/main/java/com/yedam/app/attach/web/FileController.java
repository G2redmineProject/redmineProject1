package com.yedam.app.attach.web;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.yedam.app.attach.mapper.AttachmentMapper;
import com.yedam.app.attach.service.AttachmentVO;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class FileController {

  private final AttachmentMapper attachmentMapper;
  @Value("${app.upload.dir:uploads}")
  private String uploadDir;

  @GetMapping("/files/{fileCode}")
  public ResponseEntity<Resource> download(@PathVariable Long fileCode) {

    AttachmentVO vo = attachmentMapper.selectDetailByFileCode(fileCode);
    if (vo == null) return ResponseEntity.notFound().build();

    // DB의 path(/uploads/...)는 URL용이므로, 물리 경로는 tableCode + storedName으로 만든다.
    String table = (vo.getTableCode() == null) ? "" : vo.getTableCode().toLowerCase();
    String stored = vo.getStoredName();

    if (table.isBlank() || stored == null || stored.isBlank()) {
      return ResponseEntity.notFound().build();
    }

    Path physicalPath = Paths.get(System.getProperty("user.dir"), uploadDir, table, stored);
    File f = physicalPath.toFile();
    if (!f.exists()) return ResponseEntity.notFound().build();

    Resource res = new FileSystemResource(f);

    String filename = (vo.getOriginalName() == null || vo.getOriginalName().isBlank())
        ? "file"
        : vo.getOriginalName();

    String encoded = new String(filename.getBytes(StandardCharsets.UTF_8), StandardCharsets.ISO_8859_1);

    MediaType mt = MediaType.APPLICATION_OCTET_STREAM;
    if (vo.getMimeType() != null && !vo.getMimeType().isBlank()) {
      try { mt = MediaType.parseMediaType(vo.getMimeType()); } catch (Exception ignored) {}
    }

    return ResponseEntity.ok()
        .contentType(mt)
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + encoded + "\"")
        .body(res);
  }
}
