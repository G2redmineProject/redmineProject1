package com.yedam.app.auth.service;

import lombok.Data;

@Data
public class UriAccessInfoVO {
    private String uri;
    private String category;
    private String type;  // READ, WRITE, MODIFY
}